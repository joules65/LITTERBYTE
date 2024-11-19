/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from "react"

import {Inter} from 'next/font/google'

import './globals.css'

//header

//sidebar

import {Toaster} from 'react-hot-toast'
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { getAvailableRewards, getUserByEmail } from "@/utils/database/actions"

const inter = Inter({ subsets: ['greek'] })
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(()=> {
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        if(userEmail) {
          const user = await getUserByEmail(userEmail)
          if(user) {
            const availableRewards = await getAvailableRewards(user.id) as any;
            setTotalEarnings(availableRewards);
          }
        }
      } catch (e) {
        console.error("Error fetching total earnings",e)
      }
    };
    fetchTotalEarnings(); 
  },[]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-emerald-100 flex flex-col">
          {/* header */}
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings}/>
          <div className="flex flex-1">
            {/* sidebar */}
            <Sidebar open={sidebarOpen}/>
            <main className="flex-2 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
              {children}
            </main>
          </div>
        </div>
        <Toaster/>
      </body>
    </html>
  )
}