// src/components/features/HeaderCarousel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const slides = [
  {
    image: '/banner_one.png',
    title: 'Jual & Beli Barang Bekas Berkualitas',
    description: 'Temukan barang elektronik, kendaraan, hingga pakaian preloved terbaik di sekitarmu.',
    textColor: 'text-white',
    overlayColor: 'bg-black/50',
  },
  {
    image: '/banner_two.png',
    title: 'Gadget & Elektronik Pilihan',
    description: 'Beli smartphone, laptop, dan kamera bekas berkualitas dengan harga terjangkau.',
    textColor: 'text-slate-900',
    overlayColor: 'bg-white/20 backdrop-blur-[1px]',
  },
  {
    image: '/banner_three.png',
    title: 'Otomotif & Gaya Hidup',
    description: 'Temukan kendaraan preloved terbaik dan perlengkapan hobi di dekat Anda.',
    textColor: 'text-white',
    overlayColor: 'bg-black/40',
  },
];

export default function HeaderCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 3000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="relative h-[200px] sm:h-[280px] md:h-[340px] lg:h-[380px] w-full overflow-hidden rounded-3xl shadow-lg border border-slate-100">
        {/* Slides Wrapper */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="relative h-full w-full flex-shrink-0">
              {/* Background Image */}
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />

              {/* Tint Overlay */}
              <div className={`absolute inset-0 ${slide.overlayColor} transition-colors duration-300`} />

              {/* Text Overlays */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-12 z-10">
                <div className="max-w-2xl transform transition-all duration-700 translate-y-0 opacity-100">
                  <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight ${slide.textColor} mb-3 sm:mb-4 drop-shadow-md`}>
                    {slide.title}
                  </h2>
                  <p className={`text-xs sm:text-sm md:text-base lg:text-lg font-medium max-w-lg mx-auto leading-relaxed drop-shadow-sm ${
                    slide.textColor === 'text-white' ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 text-white flex items-center justify-center transition-all z-20 backdrop-blur-sm cursor-pointer"
          aria-label="Previous slide"
        >
          &#10094;
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 text-white flex items-center justify-center transition-all z-20 backdrop-blur-sm cursor-pointer"
          aria-label="Next slide"
        >
          &#10095;
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'bg-white w-6 shadow-md'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
