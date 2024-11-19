/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"



import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import {SquareMenu, Handshake, MessageSquareDot, User,  ChevronDown, LogIn, LogOut, RecycleIcon, SearchIcon} from 'lucide-react'
import { DropdownMenuItem,DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Badge } from "./ui/badge"
import {Web3Auth} from '@web3auth/modal'
import {CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK} from '@web3auth/base'
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {EthereumPrivateKeyProvider} from "@web3auth/ethereum-provider"
import { createUser, getUnreadNotifications, getUserBalance, getUserByEmail, markNotificationAsRead } from "@/utils/database/actions"
//import {CommonPrivateKeyProvider} from "@web3auth/base-provider"

const clientId = process.env.WEB3_AUTH_CLIENT_ID; 

const chainConfig = {
    chainNamespace:CHAIN_NAMESPACES.EIP155,
    //chainNamespace: "Algorand Testnet",
    chainId: '0xaa36a7',
    //chainId: "testnet-v1.0",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    //rpcTarget: "https://api.algoexplorer.io",
    //rpcTarget: "https://testnet.algoexplorerapi.io",
    //displayName: "Algorand Testnet",
    displayName: "Sepolia Testnet",
    //blockExplorerUrl: "https://testnet.algoexplorerapi.io",
    //blockExplorerUrl: "https://api.algoexplorer.io/v2/",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    //ticker: "ALGO",
    ticker: "ETH",
    //tickerName: "Algorand",
    tickerName: "Ethereum"
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: {chainConfig},
});

//const privateKeyProvider = new CommonPrivateKeyProvider({
   // config: { chainConfig: chainConfig},
//});

const web3Auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
})


interface HeaderProps {
    onMenuClick: () => void;
    totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
    const [provider, setProvider] = useState<IProvider | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const isMobile = useMediaQuery("(max-width: 758px)");
    const [balance, setBalance] = useState(0);
  
    console.log('user info', userInfo);
    
    useEffect(() => {
      const init = async () => {
        try {
          await web3Auth.initModal();
          setProvider(web3Auth.provider);
          setLoading(false);
          try {
            await web3Auth.connect();
          } catch (error) {
            console.error("Error during connecting:", error);
            setLoading(false);
          }
  
          if (web3Auth.connected) {
            setLoggedIn(true);
            const user = await web3Auth.getUserInfo();
            setUserInfo(user);
            if (user.email) {
              localStorage.setItem('userEmail', user.email);
              try {
                await createUser(user.email, user.name || 'Anonymous User');
              } catch (error) {
                console.error("Error creating user:", error);
                // Handle the error appropriately, maybe show a message to the user
              }
            }
          }
        } catch (error) {
          console.error("Error initializing Web3Auth:", error);
        } finally {
          setLoading(false);
        }
      };
  
      init();
    }, []);
    
    useEffect(() => {
        const fetchNotifications = async () => {
            if(userInfo && userInfo.email) {
                const user = await getUserByEmail(userInfo.email)
                if(user){
                    const unreadNotifications = await getUnreadNotifications(user.id)
                    setNotifications(unreadNotifications)
                }
            }
        }
        fetchNotifications();

            const notificationInterval = setInterval(fetchNotifications,30000)
            return () => clearInterval(notificationInterval);
    }, [userInfo])

    useEffect(() => {
        const fetchUserBalance = async () => {
            if(userInfo && userInfo.email) {
                const user = await getUserByEmail(userInfo.email);
                if(user) {
                    const userBalance = await  getUserBalance(user.id)
                    if (typeof userBalance === 'number') {
                        setBalance(userBalance);
                      } else {
                        setBalance(parseFloat(userBalance) || 0);
                      }
                }
            }
        }
        fetchUserBalance();

        const handleBalanceUpdate = (event: CustomEvent) => {
            setBalance(event.detail)
        }
        window.addEventListener('balanceUpdate', handleBalanceUpdate as EventListener);

        return () => {
            window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
          };
    }, [userInfo])

    const login = async () => {
        if(!web3Auth || !web3Auth.provider) {
            console.error("Web3Auth not initialized")
            return;
        }
        try {
            const web3AuthProvider = await web3Auth.connect();
            setProvider(web3AuthProvider)
            setLoggedIn(true)
            const user = await web3Auth.getUserInfo();
            setUserInfo(user);
            if(user.email) {
                localStorage.setItem('userEmail', user.email)
                try {
                    await createUser(user.email, user.name || 'Anonymous User')
                } catch (error) {
                    console.error('Error creating user', error)
                }
            }
        } catch (error) {
            console.error('Error Logging In', error)
        }
    };

    const logout = async () => {
        if(!web3Auth) {
            console.log('web3auth not authorized')
            return;
        }
        try {
            await web3Auth.logout();
            setProvider(null);
            setLoggedIn(false);
            setUserInfo(null);
            localStorage.removeItem("userEmail");
        } catch (error) {
            console.log("Error Logging Out", error)
        }
    };

    const getUserInfo = async () => {
        if(!web3Auth.connected) {
            const user = await web3Auth.getUserInfo()
            setUserInfo(user);
            if(user.email) {
                localStorage.setItem('userEmail', user.email);
                try {
                    await  createUser(user.email, user.name || 'Anonymous User');    
                } catch (error) {
                    console.error("Error creating user", error);
                }
            }
        }
    };

    const handleNotificationClick = async (notificationId: number) => {
        await markNotificationAsRead(notificationId);
    };
    if(loading) {
        return <div>Loading web3 auth...</div>
    }

    return (
        <header className="bg-black border-b border-white-200 sticky top-0 z-50 ">
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
                        <SquareMenu className="h-6 w-6" color="white" text-green-500/>
                    </Button>
                    <Link href="/" className="flex-items-center">
                        <RecycleIcon className="h-6 w-7 md:h-8 md:w-8 text-teal-500 mr-1 md:mr-2"/>
                        <span className="font-bold text-base md:text-lg text-green-500">LitterByte</span>
                    </Link>
                </div>
                {!isMobile && (
                    <div className="flex-1 max-w-xl mx-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full px-4 py-2 border border-green-200 rounded-md focus:outline-none focus: ring-2 focus:ring-green-500"
                            />
                            <SearchIcon
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-700"
                            />
                        </div>
                    </div>
                )}
                <div className="flex items-center">
                    {isMobile && (
                        <Button variant="ghost" size="icon" className="mr-2" >
                            <SearchIcon className="h-6 w-6 text-green-500" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-2">
                                <MessageSquareDot className="h-6 w-6 text-green-500"/>
                                {notifications.length >0 && (
                                    <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                                        {notifications.length}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className=" w-64 border-green-200">
                            {notifications.length > 0 ? (
                                notifications.map((notification:any)=> (
                                    <DropdownMenuItem
                                        key={notification.id}  
                                        onClick={() => handleNotificationClick(notification.id)}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{notification.type}</span>
                                            <span className="font-sm text-green-300">{notification.message}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))
                            ): (
                                <DropdownMenuItem>No New Notifications</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="mr-2 md:mr-4 flex items-center bg-green-200 rounded-full px-2 md:px-3 py-1">
                        <Handshake className="h-4 w-4 md:h-5 md:h-5 mr-1 text-green-500"/>
                        <span className="font-semibold text-sm md:text-base text-black">{balance.toFixed(2)}</span>
                    </div>
                    {!loggedIn ? (
                        <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md text-sm">
                            LogIn
                            <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5"/>
                        </Button>
                    ): (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="items center-flex">
                                    <User className="h-6 w-6 mr-1 text-white"/>
                                    <ChevronDown className="h-4 w-4 md:h-5 md:w-5"/>
                                    <DropdownMenuContent align="end" className="w-64 border-green-200">
                                        <DropdownMenuItem onClick={getUserInfo}>
                                            {userInfo ? userInfo.name : 'Profile'} 
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Link href={"/settings"}>Settings</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={logout}>LogOut</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </Button>
                            </DropdownMenuTrigger>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );

}
