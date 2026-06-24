"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HomeGsapEffects() {
  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    gsap.set(".atlas-hero__image", { animation: "none" });
    gsap.set(".route-console", { autoAlpha: 1 });

    const heroTimeline = gsap.timeline({
      defaults: {
        duration: 0.9,
        ease: "power3.out",
      },
    });

    heroTimeline
      .from(".atlas-hero__copy > *", {
        autoAlpha: 0,
        y: 34,
        stagger: 0.08,
      })
      .from(
        ".route-console",
        {
          x: 34,
          scale: 0.96,
        },
        "-=0.55",
      );

    const desktopEffects = gsap.matchMedia();

    desktopEffects.add("(min-width: 721px)", () => {
      gsap.to(".atlas-hero__image", {
        scale: 1.08,
        yPercent: 4,
        ease: "none",
        scrollTrigger: {
          trigger: ".atlas-hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.from(".route-proof__intro > *", {
        autoAlpha: 0,
        y: 40,
        stagger: 0.08,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".route-proof",
          start: "top 72%",
        },
      });

      gsap.from(".route-proof__metrics article", {
        autoAlpha: 0,
        y: 46,
        scale: 0.94,
        stagger: 0.11,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".route-proof__metrics",
          start: "top 76%",
        },
      });

      gsap.from(".planning-bento__cell", {
        autoAlpha: 0,
        y: 42,
        scale: 0.96,
        stagger: 0.08,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".planning-stack",
          start: "top 72%",
        },
      });

      gsap.from(".atlas-feature", {
        autoAlpha: 0,
        y: 44,
        scale: 0.96,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".atlas-section",
          start: "top 70%",
        },
      });

      gsap.from(".atlas-row", {
        autoAlpha: 0,
        x: 34,
        stagger: 0.055,
        duration: 0.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".atlas-list",
          start: "top 78%",
        },
      });

      gsap.to(".kinetic-story__image", {
        scale: 1.12,
        opacity: 0.72,
        ease: "none",
        scrollTrigger: {
          trigger: ".kinetic-story",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.from(".share-artifact", {
        autoAlpha: 0,
        y: 42,
        scale: 0.94,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".kinetic-story",
          start: "top 58%",
        },
      });
    });

    return () => {
      desktopEffects.revert();
    };
  });

  return null;
}
