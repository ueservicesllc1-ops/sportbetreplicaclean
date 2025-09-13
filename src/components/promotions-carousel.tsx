import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import promotions from '@/lib/placeholder-images.json';

export function PromotionsCarousel() {
  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {promotions.placeholderImages.map((promo) => (
          <CarouselItem key={promo.id}>
            <div className="p-1">
              <Card className="overflow-hidden">
                <CardContent className="relative flex aspect-[3/1] items-center justify-center p-0">
                  <Image
                    src={promo.imageUrl}
                    alt={promo.description}
                    fill
                    className="object-cover"
                    data-ai-hint={promo.imageHint}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <h3 className="relative z-10 font-headline text-2xl font-bold text-white md:text-4xl">
                    {promo.description}
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
