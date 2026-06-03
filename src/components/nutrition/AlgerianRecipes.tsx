"use client"

import { Clock, Flame, Users, ChefHat } from "lucide-react"

interface Recipe {
  title: string
  description: string
  calories: string
  prepTime: string
  servings: number
  difficulty: "Facile" | "Moyen" | "Difficile"
  image?: string
}

const recipes: Recipe[] = [
  { title: "Htriche Healthy", description: "Version légère et protéinée de la traditionnelle htriche algérienne, parfaite après l'effort.", calories: "320 kcal", prepTime: "25 min", servings: 2, difficulty: "Facile" },
  { title: "Chorba Fit", description: "Chorba revisitée avec plus de légumes et moins de matières grasses. Riche en vitamines.", calories: "180 kcal", prepTime: "35 min", servings: 4, difficulty: "Facile" },
  { title: "Tajine Zitoun", description: "Tajine d'olives au poulet sans excès d'huile. Protéines maigres et saveurs authentiques.", calories: "420 kcal", prepTime: "45 min", servings: 4, difficulty: "Moyen" },
  { title: "Salade Méchouia", description: "Salade de légumes grillés à l'algérienne. Idéale en accompagnement ou en plat léger.", calories: "95 kcal", prepTime: "20 min", servings: 2, difficulty: "Facile" },
  { title: "Chakhchoukha Light", description: "Version allégée de la chakhchoukha traditionnelle. Riche en fibres et en saveurs.", calories: "350 kcal", prepTime: "40 min", servings: 4, difficulty: "Moyen" },
  { title: "Mhadjeb Protéiné", description: "Mhadjeb à la farine complète et farce riche en protéines. Un plaisir sans culpabilité.", calories: "280 kcal", prepTime: "30 min", servings: 2, difficulty: "Difficile" },
]

const difficultyColor = {
  "Facile": "bg-green-500/20 text-green-400",
  "Moyen": "bg-yellow-500/20 text-yellow-400",
  "Difficile": "bg-red-500/20 text-red-400",
}

export default function AlgerianRecipes() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <div key={recipe.title} className="group bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all duration-500 hover:-translate-y-1">
          <div className="aspect-video bg-gradient-to-br from-emerald-900/30 to-zinc-900 flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-zinc-700 group-hover:text-emerald-500/50 transition-colors" />
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-emerald transition-colors">{recipe.title}</h3>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{recipe.description}</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                <Flame className="w-3.5 h-3.5 text-brand-emerald" />
                <span>{recipe.calories}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                <Clock className="w-3.5 h-3.5 text-brand-emerald" />
                <span>{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                <Users className="w-3.5 h-3.5 text-brand-emerald" />
                <span>{recipe.servings} pers</span>
              </div>
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${difficultyColor[recipe.difficulty]}`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
