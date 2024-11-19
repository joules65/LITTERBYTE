/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { Icon } from 'lucide-react'
const ImpactCard = ({title,  value, icon:Icon}:{title:string,  value: string|number; icon:React.ElementType}) => {

  return (
    <div className="p-6 rounded-xl bg-lime-600 border border-white transition-all duration-300 ease-in-out hover:shadow-md">
        <Icon className="h-10 w-10 text-white mb-4"/>
        <p className="text-3xl font-bold mb-3 text-white">{value}</p>
        <p className="text-sm font-bold ">{title}</p>{" "}
    </div>
  )
}

export default ImpactCard