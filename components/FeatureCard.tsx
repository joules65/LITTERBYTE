export function FeatureCard({ icon:Icon, title, description }:{icon: React.ElementType; title:string; description: string}) {
    return (
      <div className="bg-green-950 p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ease-in-out flex flex-col items-center text-center">
        <div className="bg-green-100 p-4 rounded-full mb-6">
          <Icon className="h-8 w-8 text-green-600"/>
        </div>
        <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
        <p className="text-white leading-relaxed text-sm">{description}</p>
      </div>
    )
  }