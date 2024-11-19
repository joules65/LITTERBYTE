/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useCallback, useEffect } from "react";
import { MapPin, UploadIcon, CheckCircle2, Loader, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {GoogleGenerativeAI} from "@google/generative-ai"
import {StandaloneSearchBox,useJsApiLoader} from "@react-google-maps/api"
import { Libraries } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { stringify } from "querystring";
import { resolve } from "path";
import { resourceLimits } from "worker_threads";
import { createReport, createUser, getRecentReports, getUserByEmail } from "@/utils/database/actions";
import Image from "next/image";

const geminiApiKey = process.env.GEMINI_API_KEY as any;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY as any;

const libraries: Libraries = ["places"]

export default function ReportWastePage() {
    const [user, setUser] = useState <{ id: number; email:string; name:string } | null>(null) as any;
    const router = useRouter();

    const[reports, setReports] = useState<Array<{
        id:number;
        location:string;
        wasteType:string;
        amount: string;
        createdAt: string;
    }>>([]);

    const [newReport, setNewReport] = useState({
        location: "",
        type: "",
        amount: "",
    });

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "failure">("idle");
    
    const [verificationResult, setVerificationResult] = useState<{
        wasteType: string;
        quantity: string;
        confidence: number;
    } | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

    const {isLoaded} = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: googleMapsApiKey,
        libraries: libraries,
    }); 

    const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
        setSearchBox(ref);
    }, []);
    
    const onPlaceChanged = () => {
        if(searchBox){
            const place = searchBox.getPlaces();
            if(place && place.length > 0){
                const places = place[0];
                setNewReport(prev => ({
                    ...prev,
                    location: places.formatted_address || "",
                }));
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setNewReport({ ...newReport, [name]: value });
    };
    //handle file upload and conversion 
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]){
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const read = new FileReader();
            read.onload = (e) => {
                setPreview(e.target?.result as string);
            }
            read.readAsDataURL(selectedFile);
        }
    };
    //Convert GeminiAPI file to base64
    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        })
    }

    const handleVerification = async () => {
        if(!file) return;

        setVerificationStatus("verifying");

        try {
            const genAi = new GoogleGenerativeAI(geminiApiKey);
            const model = genAi.getGenerativeModel({model: "gemini-1.5-flash"})
            const base64File = await readFileAsBase64(file);

            const imageParts = [
                {
                    inlineData: {
                        data: base64File.split(",")[1],
                        mimeType: file.type,
                    },
                },
            ];
            const prompt = `You are an expert in waste management and recycling. Analyze the following :
            1. The type of waste (e.g., paper, plastic, glass, metal, organic)
            2. The estimate of the quantity or amount (in kg or liters)
            3. Your confidence level in this assessment as a percentage.
            
            Respond in JSON format like this: 
            {
                "wasteType": "Type of waste",
            "quantity": "estimated quantity with unit",
            "confidence": "confidence level as a number between 0 and 1",
            }`;

            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = response.text();

            try {
                const parsedResult = JSON.parse(text);
                if(parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence){
                    setVerificationResult(parsedResult)
                    setVerificationStatus("success");
                    setNewReport({
                        ...newReport,
                        type: parsedResult.wasteType,
                        amount: parsedResult.quantity,
                    });
                } else {
                    console.error("Invalid verification results", parsedResult);
                    setVerificationStatus("failure");
                }
            } catch (e) {
                console.error("Failed to parse JSON", e);
                setVerificationStatus("failure");
            }
        } catch (e) {
            console.error("Error Verifying Waste", e);
            setVerificationStatus("failure");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(verificationStatus !== "success" || !user) {
            toast.error("Please verify the waste type and amount before submitting or logging in.");
            return; 
        }
        setIsSubmitting(true);

        try {
           const report = await createReport(
            user.id, 
            newReport.location, 
            newReport.type, 
            newReport.amount, 
            preview || undefined, 
            verificationStatus ? JSON.stringify(verificationStatus): undefined) as any; 

           const formattedReport = {
            id: report.id,
            location: report.location,
            wasteType: report.wasteType,
            amount: report.amount,
            createdAt: report.createdAt.toISOString().split("T")[0],
           } as any;

           console.log("current report", reports)

           setReports([formattedReport, ...(Array.isArray(reports) ? reports : [])]);
           setNewReport({location: "", type: "", amount: ""});
           setFile(null);
           setPreview(null);
           setVerificationStatus("idle");
           setVerificationResult(null);

           toast.success("Waste report submitted successfully! You have now earned points!");
        } catch (e) {
            console.error("Error submitting report", e);
            toast.error("Failed to submit waste report. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };
      useEffect(() => {
        const checkUser = async () => {
            const email = localStorage.getItem("userEmail");
            if(email) {
                let user = await getUserByEmail(email);
                if(!user) {
                    user = await createUser(email, "Guest");
                }
                setUser(user);

                const recentReports = await getRecentReports() as any;
                const formattedReports = recentReports?.map((report: any)=>({
                    ...report,
                    createdAt: report.createdAt.toISOString().split("T")[0],
                }));
                setReports(formattedReports);
            } else {
                router.push("/login");
            }
        };
        checkUser();
      }, [router]);  

      return (
        <div className="p-8 max-w-4xl mx-auto ">
            <h1 className="text-3xl font-semibold mb-15 ml-25 text-lime-800 mx-auto text-center">Report <span className="mb-20 text-lime-600">Waste</span></h1>
            <form 
                onSubmit={handleSubmit}
                className="bg-green-950 p-8 rounded-2xl shadow-lg mb-12"
            >
                <div className="mb-8">
                    <label htmlFor="waste-image" className="block text-lg text-center font-medium text-white mb-2">Upload Waste Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-green-100 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
                        <div className="space-y-1 text-center">
                            <Upload className="flex text-sm text-green-600"/>
                            <div className="flex text-sm text-green-100">
                                <label
                                    htmlFor="waste-image"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-green-800 hover:text-green-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-800 focus:border-transparent"
                                >
                                    <span>Upload A File</span>
                                    <input
                                        id="waste-image"
                                        name="waste-image"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <p className="pl-5">Click to select a file <br/></p>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-white">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>
                </div>
                {preview && (
                    <div className="mt-4 mb-8 bg-transparent">
                        <Image 
                            src={preview} 
                            width={500}
                            height={500}
                            alt="waste-preview" 
                            className="max-w-full h-auto h-48 rounded-xl shadow-md"
                        />
                    </div>
                )}
                <Button
                    type="button"
                    onClick={handleVerification}
                    className="w-full mb-8 bg-white text-black hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-800 focus:border"
                    disabled={!file || verificationStatus === "verifying"}
                >
                   {verificationStatus === "verifying"? (
                    <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text white"/>
                    Verifying....
                    </>
                   ): "Verify Waste"}
                </Button>
                {verificationStatus === 'success' && verificationResult && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
                        <div className="flex items-center">
                        <CheckCircle2 className="h-6 w-6 text-green-400 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
                            <div className="mt-2 text-sm text-green-700">
                            <p>Waste Type: {verificationResult.wasteType}</p>
                            <p>Quantity: {verificationResult.quantity}</p>
                            <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div>
                        <label htmlFor="location" className="block text-lg font-medium text-white mb-2">Location</label>
                        {isLoaded ? (
                            <StandaloneSearchBox onLoad={onLoad} onPlacesChanged={onPlaceChanged}>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={newReport.location}
                                    onChange={handleInputChange} required
                                    className="w-full px-4 py-3 text-black rounded-md focus:outline-none focus:ring-green-800 focus:border-green-800"
                                    placeholder="Enter Waste Location."
                                />
                            </StandaloneSearchBox>
                        ):(
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={newReport.location}
                                onChange={handleInputChange} required
                                className="w-full px-4 py-3 text-black rounded-md focus:outline-none focus:ring-green-800 focus:border-green-800"
                                placeholder="Enter Waste Location"
                            />
                        )} 
                    </div>
                    <div>
                    <label htmlFor="type" className="block text-lg font-medium text-white mb-3">Waste Type</label>
                        <input
                            type="text"
                            id="type"
                            name="type"
                            value={newReport.type}
                            onChange={handleInputChange}
                            required
                            className="w-full px-10 py-2 mb-7 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-white-200"
                            placeholder="Verified waste type"
                            readOnly
                        />
                    </div>
                    <div>
                    <label htmlFor="amount" className="block text-lg font-medium text-white mb-1">Estimated Amount</label>
                        <input
                            type="text"
                            id="amount"
                            name="amount"
                            value={newReport.amount}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
                            placeholder="Verified amount"
                            readOnly
                        />
                    </div>
                </div>
                    <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-800 text-white py-3 text-lg rounded-md transition-colors duration-300 flex items-center justify-center"
                        disabled={isSubmitting}
                        >
                        {isSubmitting ? (
                            <>
                            <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Submitting...
                            </>
                        ) : ("Submit Report")}
                    </Button>
            </form>

            <h2 className="text-3xl font-semibold mb-6 text-gray-800">Recent Reports</h2>
            <div className="bg-white rounded-md shadow-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-green-950 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-green-950 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-green-950 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-green-950 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-950">
                            {Array.isArray(reports) && reports.map((report) =>(
                                <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                                {report.location}
                             </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )
}