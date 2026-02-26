import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  CheckCircle,
  BarChart2,
  Users,
  MessageSquare,
  Award,
  ArrowRight,
  Star,
  Menu,
  X,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ThemeToggle from "../components/ThemeToggle";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Testimonial Slider State
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Sarah M.",
      role: "Patient",
      quote:
        "ART Companion has completely transformed how I manage my health. The reminders are a lifesaver, and earning badges makes it actually fun!",
      rating: 5,
    },
    {
      id: 2,
      name: "Dr. James K.",
      role: "Health Provider",
      quote:
        "This system gives me the real-time data I need to support my patients effectively. The adherence tracking is accurate and insightful.",
      rating: 5,
    },
    {
      id: 3,
      name: "David L.",
      role: "Patient",
      quote:
        "I used to forget my pills often, but the WhatsApp alerts always catch me. Highly recommended for anyone on long-term medication.",
      rating: 4,
    },
  ];

  // Auto-play testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen font-sans text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield
                className="w-8 h-8 text-black dark:text-white"
                fill="currentColor"
              />
              <span className="text-xl font-bold tracking-tight">
                ART Companion
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#about"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white transition"
              >
                About
              </a>
              <a
                href="#features"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white transition"
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white transition"
              >
                Stories
              </a>
              <a
                href="#contact"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white transition"
              >
                Contact
              </a>
              <Link
                to="/login"
                className="bg-black text-white px-5 py-2 rounded-none text-sm font-medium hover:bg-neutral-800 transition"
              >
                Login
              </Link>
              <ThemeToggle className="ml-2" />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-neutral-900 border-b border-neutral-100 animate-in slide-in-from-top-4 duration-200">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <a
                href="#about"
                className="block px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-neutral-950 rounded-none"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#features"
                className="block px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-neutral-950 rounded-none"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="block px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-neutral-950 rounded-none"
                onClick={() => setIsMenuOpen(false)}
              >
                Stories
              </a>
              <a
                href="#contact"
                className="block px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-neutral-950 rounded-none"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
              <Link
                to="/login"
                className="block w-full text-center mt-4 bg-black text-white px-5 py-3 rounded-none text-base font-medium hover:bg-neutral-800 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background gradient/decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-none blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100 rounded-none blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-none bg-green-500"></span>
            Now empowering 10,000+ patients
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Stay on Track with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Your Medications
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            ART Companion connects patients and providers for better health
            outcomes. Simple reminders, gamified goals, and real-time support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link
              to="/login"
              className="px-8 py-4 bg-black text-white rounded-none font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-black/10 flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight size={20} />
            </Link>
            <a
              href="#about"
              className="px-8 py-4 bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 rounded-none font-bold text-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-20 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {/* Dummy Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-none overflow-hidden shadow-2xl relative group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-32 h-32 text-white opacity-50" />
                </div>
                {/* Floating Card 1 */}
                <div className="absolute top-10 left-10 bg-white dark:bg-neutral-900 p-4 rounded-none shadow-lg animate-bounce duration-[3000ms]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Daily Goal</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Completed!
                      </p>
                    </div>
                  </div>
                </div>
                {/* Floating Card 2 */}
                <div className="absolute bottom-10 right-10 bg-white dark:bg-neutral-900 p-4 rounded-none shadow-lg animate-bounce duration-[4000ms]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <Award size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">New Badge</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Top Performer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Redefining Healthcare Adherence
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                Managing chronic conditions shouldn't feel like a burden. ART
                Companion transforms the daily routine of medication adherence
                into an engaging, supported journey.
              </p>
              <div className="space-y-4">
                {[
                  "Intelligent reminders that adapt to your schedule",
                  "Direct connection with your healthcare provider",
                  "Secure, private, and easy to use",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="text-green-500 shrink-0" />
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Tailored tools for patients, providers, and administrators to
              ensure the best possible health outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Smart Reminders",
                desc: "Never miss a dose with timely notifications via App, SMS, or WhatsApp.",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Award,
                title: "Gamification",
                desc: "Earn points, streaks, and badges for consistent adherence. Make health fun.",
                color: "text-yellow-600",
                bg: "bg-yellow-50",
              },
              {
                icon: BarChart2,
                title: "Analytics",
                desc: "Visualize your progress with easy-to-read charts and health insights.",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: MessageSquare,
                title: "24/7 Support",
                desc: "Chat with your provider or access our AI health assistant anytime.",
                color: "text-green-600",
                bg: "bg-green-50",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-none border border-neutral-100 hover:shadow-xl hover:border-neutral-200 transition-all duration-300 group"
              >
                <div
                  className={`w-14 h-14 rounded-none ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-20 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-neutral-400">
              See what our community has to say about their journey with ART
              Companion.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            {/* Swiper Content */}
            <div className="relative overflow-hidden min-h-[300px] flex items-center justify-center">
              {testimonials.map((t, index) => (
                <div
                  key={t.id}
                  className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out transform ${
                    index === activeTestimonial
                      ? "opacity-100 translate-x-0 scale-100"
                      : "opacity-0 translate-x-10 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < t.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-neutral-700 dark:text-neutral-300"
                        }
                      />
                    ))}
                  </div>
                  <blockquote className="text-2xl md:text-3xl font-medium text-center mb-8 leading-snug">
                    "{t.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-none bg-black flex items-center justify-center text-lg font-bold">
                      {t.name[0]}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg">{t.name}</div>
                      <div className="text-neutral-400 text-sm">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-none transition-all ${
                    index === activeTestimonial
                      ? "bg-white dark:bg-neutral-900 w-8"
                      : "bg-neutral-700 hover:bg-neutral-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black pt-16 pb-8 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Shield
                  className="w-8 h-8 text-black dark:text-white"
                  fill="currentColor"
                />
                <span className="text-xl font-bold tracking-tight">
                  ART Companion
                </span>
              </div>
              <p className="text-white max-w-sm">
                Empowering patients and providers with advanced technology for
                better medication adherence and health outcomes.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Links</h4>
              <ul className="space-y-3 text-white">
                <li>
                  <a href="#about" className="hover:text-neutral-">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-neutral-">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-neutral-">
                    Testimonials
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-neutral-">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Contact</h4>
              <ul className="space-y-3 text-white">
                <li className="flex items-center gap-2">
                  <Mail size={16} /> hello@artcompanion.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={16} /> +263 867 786 6876
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={16} /> 123 Health St, Tech City
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white">
              © {new Date().getFullYear()} ART Companion. All rights reserved.
            </p>
            <div className="flex gap-6 text-white">
              <Twitter
                size={20}
                className="hover:text-neutral-300 cursor-pointer"
              />
              <Facebook
                size={20}
                className="hover:text-neutral-300 cursor-pointer"
              />
              <Instagram
                size={20}
                className="hover:text-neutral-300 cursor-pointer"
              />
              <Linkedin
                size={20}
                className="hover:text-neutral-300 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
