export interface VideoItem {
  id: string
  title: string
  category: string
  thumbnail: string
  src: string
  duration: string
  views: string
}

export interface PhotoItem {
  id: string
  src: string
  alt: string
  category: string
  photographer: string
  width: number
  height: number
}

export interface ExerciseItem {
  id: string
  name: string
  image: string
  category: string
  difficulty: "Facile" | "Intermédiaire" | "Avancé"
  duration: string
  calories: string
}

export interface TransformationItem {
  id: string
  name: string
  before: string
  after: string
  quote: string
  duration: string
  result: string
}

export interface SocialPost {
  id: string
  image: string
  likes: string
  platform: string
  username: string
}

export interface CategoryItem {
  id: string
  label: string
  icon: string
  count: number
}

export const categories: CategoryItem[] = [
  { id: "musculation", label: "Musculation", icon: "Dumbbell", count: 24 },
  { id: "cardio", label: "Cardio", icon: "Heart", count: 18 },
  { id: "yoga", label: "Yoga & Pilates", icon: "Heart", count: 12 },
  { id: "running", label: "Running", icon: "Heart", count: 15 },
  { id: "crossfit", label: "CrossFit", icon: "Zap", count: 20 },
  { id: "nutrition", label: "Nutrition", icon: "Apple", count: 10 },
]

export const videos: VideoItem[] = [
  { id: "v1", title: "Séance Complète Musculation", category: "musculation", thumbnail: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "12:30", views: "2.4k" },
  { id: "v2", title: "HIIT Cardio Brûle-Graisse", category: "cardio", thumbnail: "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "8:45", views: "3.1k" },
  { id: "v3", title: "Yoga pour Débutants", category: "yoga", thumbnail: "https://images.pexels.com/photos/2604461/pexels-photo-2604461.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "15:00", views: "1.8k" },
  { id: "v4", title: "Entraînement CrossFit Intense", category: "crossfit", thumbnail: "https://images.pexels.com/photos/17820056/pexels-photo-17820056.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "20:15", views: "4.2k" },
  { id: "v5", title: "Course à Pied : Guide Complet", category: "running", thumbnail: "https://images.pexels.com/photos/439538/pexels-photo-439538.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "10:00", views: "1.5k" },
  { id: "v6", title: "Préparation des Repas Fitness", category: "nutrition", thumbnail: "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "6:20", views: "5.7k" },
  { id: "v7", title: "Développé Couché Technique", category: "musculation", thumbnail: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "7:30", views: "3.8k" },
  { id: "v8", title: "Zumba Cardio Party", category: "cardio", thumbnail: "https://images.pexels.com/photos/3758142/pexels-photo-3758142.jpeg", src: "https://www.youtube.com/embed/UDATUfvf9cI", duration: "25:00", views: "6.2k" },
]

export const photos: PhotoItem[] = [
  { id: "p1", src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop", alt: "Salle de musculation", category: "musculation", photographer: "William Cho", width: 800, height: 533 },
  { id: "p2", src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop", alt: "Femme stretching", category: "yoga", photographer: "Andrea Piacquadio", width: 800, height: 1200 },
  { id: "p3", src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop", alt: "Homme musculation", category: "musculation", photographer: "Caleb Frith", width: 800, height: 534 },
  { id: "p4", src: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=600&fit=crop", alt: "Coureur sur route", category: "running", photographer: "Pixabay", width: 800, height: 533 },
  { id: "p5", src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop", alt: "CrossFit box", category: "crossfit", photographer: "RODNAE Productions", width: 800, height: 533 },
  { id: "p6", src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop", alt: "Repas sains", category: "nutrition", photographer: "Pixabay", width: 800, height: 533 },
  { id: "p7", src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop", alt: "Yoga en extérieur", category: "yoga", photographer: "Matthias Zomer", width: 800, height: 534 },
  { id: "p8", src: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop", alt: "Cours collectif", category: "cardio", photographer: "Ketut Subiyanto", width: 800, height: 533 },
  { id: "p9", src: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&h=600&fit=crop", alt: "Haltères", category: "musculation", photographer: "Melvin Buezo", width: 800, height: 533 },
  { id: "p10", src: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&h=600&fit=crop", alt: "Tapis de course", category: "cardio", photographer: "Michael Reuter", width: 800, height: 533 },
  { id: "p11", src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop", alt: "Pilates", category: "yoga", photographer: "Matthias Zomer", width: 800, height: 534 },
  { id: "p12", src: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&h=600&fit=crop", alt: "Corde à sauter", category: "crossfit", photographer: "Andrea Piacquadio", width: 800, height: 1200 },
  { id: "p13", src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop", alt: "Smoothie fitness", category: "nutrition", photographer: "Ella Olsson", width: 800, height: 533 },
  { id: "p14", src: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop", alt: "Course en nature", category: "running", photographer: "Sean Ihli", width: 800, height: 533 },
  { id: "p15", src: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop", alt: "Équipement gym", category: "musculation", photographer: "Pixabay", width: 800, height: 533 },
  { id: "p16", src: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&h=600&fit=crop", alt: "Femme soulevant poids", category: "crossfit", photographer: "Andres Ayrton", width: 800, height: 533 },
]

export const exercises: ExerciseItem[] = [
  { id: "e1", name: "Développé Couché", image: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg", category: "musculation", difficulty: "Intermédiaire", duration: "45 min", calories: "320 kcal" },
  { id: "e2", name: "Squat Chargé", image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg", category: "musculation", difficulty: "Avancé", duration: "40 min", calories: "280 kcal" },
  { id: "e3", name: "Burpees Intensifs", image: "https://images.pexels.com/photos/17820056/pexels-photo-17820056.jpeg", category: "crossfit", difficulty: "Avancé", duration: "15 min", calories: "200 kcal" },
  { id: "e4", name: "Yoga Flow", image: "https://images.pexels.com/photos/2604461/pexels-photo-2604461.jpeg", category: "yoga", difficulty: "Facile", duration: "30 min", calories: "120 kcal" },
  { id: "e5", name: "Fractionné Tapis", image: "https://images.pexels.com/photos/374102/pexels-photo-374102.jpeg", category: "cardio", difficulty: "Intermédiaire", duration: "20 min", calories: "250 kcal" },
  { id: "e6", name: "Tractions", image: "https://images.pexels.com/photos/2383854/pexels-photo-2383854.jpeg", category: "musculation", difficulty: "Avancé", duration: "30 min", calories: "180 kcal" },
  { id: "e7", name: "Course 5km", image: "https://images.pexels.com/photos/439538/pexels-photo-439538.jpeg", category: "running", difficulty: "Facile", duration: "30 min", calories: "350 kcal" },
  { id: "e8", name: "Préparation Repas", image: "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg", category: "nutrition", difficulty: "Facile", duration: "60 min", calories: "-" },
]

export const transformations: TransformationItem[] = [
  { id: "t1", name: "Sarah M.", before: "https://images.pexels.com/photos/3758142/pexels-photo-3758142.jpeg", after: "https://images.pexels.com/photos/3837783/pexels-photo-3837783.jpeg", quote: "J'ai perdu 15 kg en 6 mois grâce aux programmes sur mesure et au coaching personnalisé.", duration: "6 mois", result: "-15 kg" },
  { id: "t2", name: "Karim H.", before: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg", after: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg", quote: "J'ai transformé mon corps et gagné en confiance. Le crossfit a changé ma vie.", duration: "8 mois", result: "+12 kg muscle" },
  { id: "t3", name: "Amina B.", before: "https://images.pexels.com/photos/2604472/pexels-photo-2604472.jpeg", after: "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg", quote: "Le yoga et la nutrition m'ont aidée à retrouver mon équilibre intérieur.", duration: "4 mois", result: "-8 kg" },
]

export const socialPosts: SocialPost[] = [
  { id: "s1", image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg", likes: "1 234", platform: "Instagram", username: "@infinitygym" },
  { id: "s2", image: "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg", likes: "2 567", platform: "Instagram", username: "@infinitygym" },
  { id: "s3", image: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg", likes: "892", platform: "TikTok", username: "@infinitygym" },
  { id: "s4", image: "https://images.pexels.com/photos/2604461/pexels-photo-2604461.jpeg", likes: "1 789", platform: "Instagram", username: "@infinitygym" },
  { id: "s5", image: "https://images.pexels.com/photos/439538/pexels-photo-439538.jpeg", likes: "654", platform: "Facebook", username: "Infinity Gym" },
  { id: "s6", image: "https://images.pexels.com/photos/17820056/pexels-photo-17820056.jpeg", likes: "3 210", platform: "Instagram", username: "@infinitygym" },
  { id: "s7", image: "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg", likes: "1 456", platform: "TikTok", username: "@infinitygym" },
  { id: "s8", image: "https://images.pexels.com/photos/2094445/pexels-photo-2094445.jpeg", likes: "987", platform: "Instagram", username: "@infinitygym" },
]
