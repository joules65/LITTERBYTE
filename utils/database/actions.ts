/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import error from "next/error";
import { db } from "./dbConfig";
import { Notifications, Users, Transactions, Reports, Rewards, CollectedWaste } from "./schema";
import { eq, sql, and, desc } from "drizzle-orm";

export async function createUser(email: string, name: string) {
    try {
        const [user] = await db.insert(Users).values({email, name}).returning().execute();
        return user;
    } catch (error) {
       console.error('Error creating user', error) 
       return null;
    }
}

export async function getUserByEmail(email: string) {
    try {
        const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute();
        return user;
    } catch (error) {
        console.log('Error getting user by email', error)
        return null;
    }
}

export async function getUnreadNotifications(userId:number)  {
    try {
        return db.select().from(Notifications).where(and(eq(Notifications.userId, userId), eq(Notifications.isRead, false))).execute();
    } catch (error) {
        console.log("Error fetching unread Notifications", error)
    }
}

export async function getUserBalance(userId:number) { 
    const transactions = await getRewardTransactions(userId) || [];

    const balance = transactions.reduce((acc:number, transaction:any)=> {
        return transaction.type.startsWith('earned') ? acc + transaction.amount: acc - transaction.amount
    }, 0)
    return Math.max(balance, 0)
}

export async function getRewardTransactions(userId:number) {
    try {
        const transactions = await db.select({
            id:Transactions.id,
            type: Transactions.type,
            amount: Transactions.amount,
            description: Transactions.description,
            date: Transactions.date
        }).from(Transactions).where(eq(Transactions.userId, userId)).orderBy(desc(Transactions.date)).limit(15).execute();

        const formatTransactions = transactions.map(t=> ({
            ...t,
            date: t.date.toISOString().split('T')[0]
            //YYYY-MM-DD
        }))
        return formatTransactions
    } catch (error) {
        console.error("Error fetching reward transactions", error)
        return null
    }
}

export async function markNotificationAsRead(notificationId: number) {
    try {
        await db.update(Notifications).set({isRead: true}).where(eq(Notifications.id, notificationId)).execute();
    } catch (error) {
        console.error('Error marking notifications as read', error);
        return null;
    }
}

export async function createReport(
    userId:number,
    location: string,
    wasteType:string,
    amount: string,
    imageUrl?: string,
    verificationResult?: any
) {
    try {
      const [report] = await db.insert(Reports).values({
        userId, 
        location,
        wasteType, 
        amount, 
        imageUrl, 
        verificationResult, 
        status: "pending",
      }).returning().execute(); 

      const pointsEarned = 10; 
      //updateRewardPoints
      await updateRewardPoints(userId, pointsEarned);
      //createTransactions
      await createTransactions(userId, 'earned_report', pointsEarned, `Earned points for reporting a waste at ${location}`);
      //createNotifications
      await createNotifications(userId, `You earned ${pointsEarned} points for reporting a waste at ${location}`, "Notifications");
      return report;
    } catch (e) {
        console.error("Error creating report", e);
        return null;
    }
}

export async function updateRewardPoints(userId: number, points: number) {
    try {
      const [updatedRewards] = await db.update(Rewards).set({
        points: sql`${Rewards.points} + ${points}`
      }).where(eq(Rewards.userId, userId)).returning().execute();
      return updatedRewards;  
    } catch (e) {
        console.error('Error updating reward points', e);
        return null;
    }
}

export async function createTransactions(userId: number, type: "earned_report" | "earned_collect" | "redeemed", amount: number, description: string) {
    try {
        const [transaction] = await db.insert(Transactions).values({
            userId, type, amount, description
        }).returning().execute();
        return transaction;
    } catch (e) {
        console.error('Error creating transactions', e);
        throw e;
    }
}

export async function createNotifications(userId: number, message: string, type: string){
    try {
      const [notification] = await db.insert(Notifications).values({userId, message, type}).returning().execute(); 
      return notification;
    } catch (e) {
        console.error("Error creating notification",e)
    }
}

export async function getRecentReports(limit: number=10) {
    try {
        const reports = await db.select().from(Reports).orderBy(desc(Reports.createdAt)).limit(limit).execute();
        return reports;
    } catch (e) {
        console.error("Error getting recent reports",e);
        return [];
    }
}

export async function getAvailableRewards(userId: number) {
    try {
        const userTransactions = await getRewardTransactions(userId) as any;
        const userPoints = userTransactions?.reduce((acc:any, transaction:any) => {return transaction.type.startsWith('earned')? acc + transaction.amount : acc - transaction.amount},0);
        const dbRewards = await db.select({
            id: Rewards.id,
            name: Rewards.name,
            points: Rewards.points,
            description: Rewards.description,
            collectionInfo: Rewards.collectionInfo
        }).from(Rewards).where(eq(Rewards.isAvailable, true)).execute();

        const allRewards = [{
            id:0,
            name: "Points",
            cost: userPoints,
            description: "Earn points by reporting waste",
            collectionInfo: "Submit a report in the app to earn points"
        }, ...dbRewards];

        return allRewards;
    } catch (e) {
        console.error("Error fetching available rewards",e);
        return [];
    }
}

export async function getWasteCollectionTask(limit: number=20) {
    try {
        const task = await db.select({
            id: Reports.id,
            location: Reports.location,
            wasteType: Reports.wasteType,
            amount: Reports.amount,
            status: Reports.status,
            collectorId: Reports.collectorId,
            date: Reports.createdAt
        }).from(Reports).limit(limit).execute();

        return task.map((task:any)=> ({
            ...task,
            date: task.date.toISOString().split('T')[0],
        }));
    } catch (e) {
        console.error("Error fetching waste collection task",e);
        return [];
    }
}

export async function updateTaskStatus(reportId:number, newStatus:string, collectorId?:number){
    try {
        const updateData: any = {status: newStatus};
        if(collectorId !== undefined) {
            updateData.collectorId = collectorId;
        } 
        const [updateReport] = await db.update(Reports).set(updateData).where(eq(Reports.id, reportId)).returning().execute();
        return updateReport;
    } catch (e) {
        console.error("Error updating task status",e);
        throw error;
    }
}

export async function saveReward(userId:number, amount:number){
    try {
        const [reward] = await db.insert(Rewards).values({
            userId,
            name: "Waste Collection Reward",
            collectionInfo: "Points earned from waste collection",
            points:amount,
            isAvailable: true,
        }).returning().execute();
    
        await createTransactions(userId, 'earned_collect', amount, `Earned ${amount} points for collecting waste`); 
    } catch (e) {
        console.error("error saving reward",e);
        throw error;
    }
    
}

export async function saveCollectedWaste(reportId: number, collectorId:number, verificationResult: any){
    try {
        const [collectedWaste] = await db
          .insert(CollectedWaste)
          .values({
            reportId,
            collectorId,
            collectionDate: new Date(),
            status: 'verified',
          })
          .returning()
          .execute();
        return collectedWaste;
      } catch (error) {
        console.error("Error saving collected waste:", error);
        throw error;
      }
}

export async function createTransaction(userId: number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string) {
    try {
      const [transaction] = await db
        .insert(Transactions)
        .values({ userId, type, amount, description })
        .returning()
        .execute();
      return transaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  export async function getAllRewards() {
    try {
      const rewards = await db
        .select({
          id: Rewards.id,
          userId: Rewards.userId,
          points: Rewards.points,
          level: Rewards.level,
          createdAt: Rewards.createAt,
          userName: Users.name,
        })
        .from(Rewards)
        .leftJoin(Users, eq(Rewards.userId, Users.id))
        .orderBy(desc(Rewards.points))
        .execute();
  
      return rewards;
    } catch (error) {
      console.error("Error fetching all rewards:", error);
      return [];
    }
  }

export async function getOrCreateReward(userId: number) {
    try {
      let [reward] = await db.select().from(Rewards).where(eq(Rewards.userId, userId)).execute();
      if (!reward) {
        [reward] = await db.insert(Rewards).values({
            userId,
            name: 'Default Reward',
            collectionInfo: 'Default Collection Info',
            points: 0,
            level: 1,
            isAvailable: true,
        }).returning().execute();


      }
      return reward;
    } catch (error) {
      console.error("Error getting or creating reward:", error);
      return null;
    }
  }

export async function redeemReward(userId: number, rewardId: number) {
    try {
      const userReward = await getOrCreateReward(userId) as any;
      
      if (rewardId === 0) {
        // Redeem all points
        const [updatedReward] = await db.update(Rewards)
          .set({ 
            points: 0,
            updatedAt: new Date(),
          })
          .where(eq(Rewards.userId, userId))
          .returning()
          .execute();
  
        // Create a transaction for this redemption
        await createTransactions(userId, 'redeemed', userReward.points, `Redeemed all points: ${userReward.points}`);
  
        return updatedReward;
      } else {
        // Existing logic for redeeming specific rewards
        const availableReward = await db.select().from(Rewards).where(eq(Rewards.id, rewardId)).execute();
  
        if (!userReward || !availableReward[0] || userReward.points < availableReward[0].points) {
          throw new Error("Insufficient points or invalid reward");
        }
  
        const [updatedReward] = await db.update(Rewards)
          .set({ 
            points: sql`${Rewards.points} - ${availableReward[0].points}`,
            updatedAt: new Date(),
          })
          .where(eq(Rewards.userId, userId))
          .returning()
          .execute();
  
        // Create a transaction for this redemption
        await createTransactions(userId, 'redeemed', availableReward[0].points, `Redeemed: ${availableReward[0].name}`);
  
        return updatedReward;
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      throw error;
    }
  }