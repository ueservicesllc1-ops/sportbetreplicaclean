
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
  title: string;
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
        <div className="p-1">
            <Skeleton className="aspect-[3/1] w-full rounded-lg" />
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
        {banners.map((promo) => (
          <CarouselItem key={promo.id}>
            <div className="p-1">
              <Card className="overflow-hidden">
                <CardContent className="relative flex aspect-[3/1] items-center justify-center p-0">
                  <Image
                    src={promo.imageUrl}
                    alt={promo.title}
                    fill
                    className="object-cover"
                    priority={true}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <h3 className="relative z-10 font-headline text-2xl font-bold text-white md:text-4xl">
                    {promo.title}
                  </h3>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="ml-16 hidden sm:flex" />
      <CarouselNext className="mr-16 hidden sm:flex" />
    </Carousel>
  );
}
