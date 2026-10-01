"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ResilientImage } from "@/components/resilient-image";

gsap.registerPlugin(ScrollTrigger);

type RouteStoryCard = {
  title: string;
  text: string;
  image: {
    src: string;
    alt: string;
  };
};

type RouteScrollStoryProps = {
  cards: RouteStoryCard[];
};

export function RouteScrollStory({ cards }: RouteScrollStoryProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      const media = gsap.matchMedia();

      // Revert pins and inline styles when switching to the stacked layout or
      // enabling reduced motion, including changes after the initial render.
      media.add("(min-width: 981px) and (prefers-reduced-motion: no-preference)", () => {
        const cardEls = gsap.utils.toArray<HTMLElement>(".route-story__card", root);

        cardEls.forEach((card, index) => {
          const nextCard = cardEls[index + 1];
          const image = card.querySelector<HTMLElement>(".route-story__visual");

          gsap.set(card, {
            opacity: 1,
            zIndex: index + 1,
          });

          if (image) {
            gsap.fromTo(
              image,
              { scale: 0.88, opacity: 0.58 },
              {
                scale: 1,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top 70%",
                  end: "center center",
                  scrub: true,
                },
              },
            );

            gsap.to(image, {
              scale: 1.08,
              opacity: 0.28,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "center center",
                end: "bottom top",
                scrub: true,
              },
            });
          }

          if (!nextCard) {
            return;
          }

          ScrollTrigger.create({
            trigger: card,
            start: "top top",
            endTrigger: cardEls[cardEls.length - 1],
            end: "top top",
            pin: true,
            pinSpacing: false,
          });

          ScrollTrigger.create({
            trigger: nextCard,
            start: "top 72%",
            onEnter: () => gsap.set(card, { autoAlpha: 0 }),
            onLeaveBack: () => gsap.set(card, { autoAlpha: 1 }),
          });

          gsap.to(card, {
            scale: 0.92,
            ease: "none",
            scrollTrigger: {
              trigger: nextCard,
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          });
        });
      });

      return () => media.revert();
    },
    { scope: rootRef },
  );

  return (
    <section className="route-story" ref={rootRef} aria-label="Route planning method">
      {cards.map((card) => (
        <article className="route-story__card" key={card.title}>
          <div className="route-story__panel">
            <div className="route-story__copy">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
            <div className="route-story__media">
              <ResilientImage
                alt={card.image.alt}
                className="route-story__visual"
                src={card.image.src}
                fill
                sizes="(max-width: 900px) 100vw, 48vw"
              />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
