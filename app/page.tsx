/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from "next/image";
import { ArrowRight, RecycleIcon, TreeDeciduous, Users, Handshake, MapPin, ChevronDown, LeafyGreenIcon, ReplyIcon, Banknote, CloudCogIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Rewards } from "@/utils/database/schema";
import { FeatureCard } from "@/components/FeatureCard";
import Anima from "@/components/Anima";
import ImpactCard from "@/components/ImpactCard";


export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-20">
        <Anima/>
        <h1 className="text-7xl font-bold mb-6 text-lime-950 tracking-tight">LITTERBYTE: <span className="text-green-600">Waste2Wealth</span></h1>
        <p className="text-4xl font-semibold mb-6 text-emerald-800 mx-auto leading-relaxed"> Make Our Cities Green Again!</p>
        <Button className="bg-green-800 hover:bg-green-950 text-white text-lg py-6 rounded-full">Report Waste</Button>
      </section>

      <section className="grid md:grid-cols-3 gap-10 mb-20">
        <FeatureCard
          icon={TreeDeciduous}
          title="Environmentally friendly"
          description="We aim to reduce waste and promote sustainability, and instill a committment to the environment in the community"
        />
        <FeatureCard
          icon={Handshake}
          title="Earn all kinds of rewards!"
          description="If the earth is green you're rich! It's a win-win!"
        />
        <FeatureCard
          icon={Users}
          title="Community-Driven"
          description="Join a community that cares! sustainability is our strength!" 
        />
      </section>
      
      <section className="bg-green-950 p-10 rounded-3xl shadow-lg mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center text-white">Our Impact</h2>
        <div className="grid  gap-5">
          <ImpactCard
            title="Waste Collected"
            //value={`${impactData.wasteCollected} kg`}
            value={"20,000 Kg"}
            icon={RecycleIcon}
          />
          <ImpactCard
            title="Reported Data"
            //value={`${impactData.wasteCollected} kg`}
            value={"30,000"}
            icon={ReplyIcon}
          />
          <ImpactCard
            title="Rewards Earned"
            //value={`${impactData.wasteCollected} kg`}
            value={"₦100,000,000"}
            icon={Banknote}
          />
          <ImpactCard
            title="C02 Offset"
            //value={`${impactData.wasteCollected} kg`}
            value={"3500 Kg"}
            icon={CloudCogIcon}
          />
        </div>
      </section>
    </div>
  );
}

