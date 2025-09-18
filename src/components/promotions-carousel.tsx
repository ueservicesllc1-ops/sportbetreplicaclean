
'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import Autoplay from "embla-carousel-autoplay";


interface BannerDoc {
  id: string;
  imageUrl: string;
  createdAt: Timestamp;
}

export function PromotionsCarousel() {
  const [banners, setBanners] = useState<BannerDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannersData: BannerDoc[] = [];
      snapshot.forEach((doc) => {
        bannersData.push({ id: doc.id, ...doc.data() } as BannerDoc);
      });
      setBanners(bannersData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching banners: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  if (loading) {
      return (
        <div className="container mx-auto px-2 md:px-4 py-4">
            <Skeleton className="aspect-[5/2] w-full rounded-lg" />
        </div>
      )
  }

  if (banners.length === 0) {
    return null; // Don't show the carousel if there are no banners
  }

  return (
    <Carousel 
        className="w-full" 
        opts={{ loop: true }}
        plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
    >
      <CarouselContent>
        {banners.map((promo, index) => (
          <CarouselItem key={promo.id}>
            <div className="p-0">
              <div className="relative flex aspect-[5/2] items-center justify-center p-0">
                  <Image
                    src={promo.imageUrl}
                    alt={'Promotional Banner'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={index === 0}
                  />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className='hidden sm:block container mx-auto relative'>
        <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
      </div>
    </Carousel>
  );
}

    