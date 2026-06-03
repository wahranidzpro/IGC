"use client"

import { motion } from "framer-motion"
import { Heart, ArrowRight, Camera, Globe } from "lucide-react"
import { socialPosts } from "@/lib/galerie/mockData"

export default function ReseauxSociaux() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Suivez-nous sur les Réseaux
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Rejoignez notre communauté et partagez votre progression
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {socialPosts.map((post, i) => (
            <motion.a
              key={post.id}
              href="#"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              whileHover={{ scale: 1.03 }}
              className="group relative aspect-square rounded-xl overflow-hidden border border-white/5"
            >
              <img
                src={post.image}
                alt={`Post ${post.platform}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="flex items-center gap-1.5 text-white text-sm font-semibold bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Heart className="w-4 h-4 text-brand-red fill-brand-red" />
                  {post.likes}
                </span>
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs">{post.username}</span>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 text-brand-accent hover:text-white font-semibold transition-colors group"
          >
            <Camera className="w-4 h-4" />
            Voir plus sur Instagram
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
