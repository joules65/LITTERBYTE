/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Handshake, ArrowUpRightFromSquare, ArrowDownRightFromSquare, GiftIcon, AlertTriangle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { createTransaction, getAvailableRewards, getRewardTransactions, getUserByEmail, redeemReward } from "@/utils/database/actions"


type Transaction = {
    id: number;
    type: "earned_report" | "earned_collect" | "redeemed";
    amount: number;
    description: string;
    date: string;
}

type Reward = {
    id: number;
    name: string;
    description: string | null;
    collectionInfo: string;
    cost: number;
  }

export default function Rewards() {
    const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserDataAndRewards = async () => {
            setLoading(true);
            try {
                const userEmail = localStorage.getItem("userEmail");
                if(userEmail) {
                    const fetchedUser = await getUserByEmail(userEmail);
                    if(fetchedUser) {
                        setUser(fetchedUser);
                        const fetchedTransactions = await getRewardTransactions(fetchedUser.id);
                        setTransactions(fetchedTransactions as  Transaction[]);
                        const fetchedRewards = await getAvailableRewards(fetchedUser.id);
                        setRewards(fetchedRewards as Reward[]);



                        const calculatedBalance = fetchedTransactions?.reduce((acc:any,transactions)=>{
                            return transactions.type.startsWith("earned")? acc + transactions.amount : acc - transactions.amount;
                        },0);
                        setBalance(Math.max(calculatedBalance,0));
                    } else {
                        toast.error("Failed to fetch user data, please log in again.");
                    }
                } else {
                    toast.error("User not found, please log in.");
                }
            } catch (e) {
                console.error("Error fetching user data:", e);
                toast.error("Failed to fetch rewards data, please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchUserDataAndRewards();
    },[]);
    
    const handleRedeemReward = async (rewardId: number) => {
        if (!user) {
          toast.error('Please log in to redeem rewards.')
          return
        }
    
        const reward = rewards.find(r => r.id === rewardId)
        if (reward && balance >= reward.cost && reward.cost > 0) {
          try {
            if (balance < reward.cost) {
              toast.error('Insufficient balance to redeem this reward')
              return
            }
    
            // Update database
            await redeemReward(user.id, rewardId);
            
            // Create a new transaction record
            await createTransaction(user.id, 'redeemed', reward.cost, `Redeemed ${reward.name}`);
    
            // Refresh user data and rewards after redemption
            await refreshUserData();
    
            toast.success(`You have successfully redeemed: ${reward.name}`)
          } catch (error) {
            console.error('Error redeeming reward:', error)
            toast.error('Failed to redeem reward. Please try again.')
          }
        } else {
          toast.error('Insufficient balance or invalid reward cost')
        }
      }
    
      const handleRedeemAllPoints = async () => {
        if (!user) {
          toast.error('Please log in to redeem points.');
          return;
        }
    
        if (balance > 0) {
          try {
            // Update database
            await redeemReward(user.id, 0);
            
            // Create a new transaction record
            await createTransaction(user.id, 'redeemed', balance, 'Redeemed all points');
    
            // Refresh user data and rewards after redemption
            await refreshUserData();
    
            toast.success(`You have successfully redeemed all your points!`);
          } catch (error) {
            console.error('Error redeeming all points:', error);
            toast.error('Failed to redeem all points. Please try again.');
          }
        } else {
          toast.error('No points available to redeem')
        }
      }
    
      const refreshUserData = async () => {
        if (user) {
          const fetchedUser = await getUserByEmail(user.email);
          if (fetchedUser) {
            const fetchedTransactions = await getRewardTransactions(fetchedUser.id);
            setTransactions(fetchedTransactions as Transaction[]);
            const fetchedRewards = await getAvailableRewards(fetchedUser.id);
            setRewards(fetchedRewards.filter(r => r.cost > 0) as Reward[]); // Filter out rewards with 0 points
            
            // Recalculate balance
            const calculatedBalance = fetchedTransactions.reduce((acc, transaction) => {
              return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount
            }, 0)
            setBalance(Math.max(calculatedBalance, 0)) // Ensure balance is never negative
          }
        }
      }

    if(loading) {
        return <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-green-950" />
        </div>
    }
    return (
        <div className="p-10 max-w-3xl mx-auto">
            <h1 className="text-5xl text-center font-semibold mb-6 text-green-950">Rewards</h1>
            <div className="bg-black p-6 rounded-xl shadow-lg flex flex-col justify-between h-full border-l-4 border-green-500 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Reward Balance</h2>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center">
            <Handshake className="w-10 h-10 mr-3 text-green-500" />
            <div>
              <span className="text-4xl font-bold text-green-200">{balance}</span>
              <p className="text-sm text-white">Available Points</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-col-2 gap-8">
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-green-950">Recent Transactions</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {transactions.length > 0 ? (
                    transactions.map((transaction:any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border-b border-green-800">
                            <div className="flex items-center">
                                {transaction.type === "earned_report" ? (
                                    <ArrowDownRightFromSquare className="w-5 h-5 text-green-500 mr-3"/>
                                ): transaction.type === "earned_collect"? (
                                    <ArrowUpRightFromSquare className="w-5 h-5 text-purple-500 mr-3"/>
                                ):(<ArrowDownRightFromSquare className="w-5 h-5 text-red-500 mr-3"/>)}
                                <div>
                                    <p className="font-medium text-black">{transaction.description}</p>
                                    <p className="text-sm text-blue-600">{transaction.date}</p>
                                </div>
                                <span className={`font-semibold ${transaction.type.startsWith("earned") ? "text-green-500" : "text-red-500"}`}>
                                    {transaction.type.startsWith("earned") ? "+" : "-"}
                                    {transaction.amount}
                                </span>
                            </div>
                        </div>
                    ))
                ): (
                    <div className="p-4 text-center text-black">No Transactions Yet</div>
                )}
            </div>
        </div>
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-black">Available Rewards
                <div className="space-y-4">{rewards.length > 0 ? (
                    rewards.map((reward:any)=>(
                        <div key={reward.id} className="bg-white p-4 rounded-xl shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{reward.name}</h3>
                    <span className="text-green-500 font-semibold">{reward.cost} points</span>
                  </div>
                  <p className="text-gray-600 mb-2">{reward.description}</p>
                  <p className="text-sm text-gray-500 mb-4">{reward.collectionInfo}</p>
                  {reward.id === 0 ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={handleRedeemAllPoints}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                        disabled={balance === 0}
                      >
                        <GiftIcon className="w-4 h-4 mr-2" />
                        Redeem All Points
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleRedeemReward(reward.id)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      disabled={balance < reward.cost}
                    >
                      <GiftIcon className="w-4 h-4 mr-2" />
                      Redeem Reward
                    </Button>
                  )}
                </div>
              ))
                ):(
                    <></>
                )}
                </div>
            </h2>
        </div>
      </div>
        </div>
        
    )

}