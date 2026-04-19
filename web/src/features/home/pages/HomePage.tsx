import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Shield,
  Users,
  Globe,
  Sparkles,
  CheckCircle2,
  Check,
  X,
  Star,
  ArrowRight,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/common/AnimatedSection';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { apiClient, type ApiResponse } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/routes';
import { CONFIG } from '@/lib/constants/config';

/* ─────────────────────────────────────────── */
/*  Data                                        */
/* ─────────────────────────────────────────── */

const features = [
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Full control over who sees your profile, photos, and contact information. Your data stays yours.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Sparkles,
    title: 'Smart Matching',
    description:
      'Compatibility scoring based on preferences, values, culture, and lifestyle for meaningful connections.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Users,
    title: 'Verified Profiles',
    description:
      'Every profile is email-verified. We review profiles to build a trusted, genuine community.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Globe,
    title: 'Global Tamil Community',
    description:
      'Connect with Tamil singles in the UK, Sri Lanka, India, Canada, Australia, and worldwide.',
    color: 'bg-amber-50 text-amber-600',
  },
];

function useStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ totalProfiles: number; successfulMatches: number; countriesReached: number; verifiedPercentage: number }>>('/stats')
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}


// Success stories fetched from API — empty until real couples share their stories

const plans = [
  {
    name: 'Free',
    price: '£0',
    period: '/forever',
    popular: false,
    features: [
      '10 profile views/month',
      '5 interests/month',
      'Basic search',
      'Browse profiles',
    ],
  },
  {
    name: 'Silver',
    price: '£9.99',
    period: '/month',
    popular: false,
    features: ['30 profile views/month', '15 interests/month', 'Limited chat', 'Who viewed me'],
  },
  {
    name: 'Gold',
    price: '£19.99',
    period: '/month',
    popular: true,
    features: [
      '25 profile views/month',
      '25 interests/month',
      'Full chat access',
      'View contact info',
      '1 boost/month',
    ],
  },
  {
    name: 'Platinum',
    price: '£29.99',
    period: '/month',
    popular: false,
    features: [
      '30 profile views/month',
      '30 interests/month',
      'Priority support',
      '3 boosts/month',
      'Premium badge',
    ],
  },
];

/* ─────────────────────────────────────────── */
/*  Page                                        */
/* ─────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <PlansSection />
      <CTASection />
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Hero                                        */
/* ─────────────────────────────────────────── */

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white"
      style={{ isolation: 'isolate', contain: 'paint' }}
    >
      {/* Ambient light effects — GPU-layered for performance */}
      <div className="absolute inset-0 overflow-hidden" style={{ transform: 'translateZ(0)' }}>
        <motion.div
          className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-accent-400/10 blur-[120px] transform-gpu"
          style={{ willChange: 'transform, opacity' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-primary-400/10 blur-[120px] transform-gpu"
          style={{ willChange: 'transform, opacity' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-accent-500/5 blur-[100px] transform-gpu"
          style={{ willChange: 'transform' }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="page-container relative py-20 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="gold" className="mb-6 px-4 py-1.5 text-sm font-medium">
                <Heart className="mr-1.5 h-3.5 w-3.5 fill-current" />
                Trusted by Tamil families worldwide
              </Badge>
            </motion.div>

            <motion.h1
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              Where Tamil Hearts{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent">
                  Find Home
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-accent-400/0 via-accent-400 to-accent-400/0 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                />
              </span>
            </motion.h1>

            <motion.p
              className="mt-8 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              A premium matrimony platform crafted for the global Tamil community. Find your life
              partner with trust, tradition, and the care your journey deserves.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button size="xl" variant="gold" className="group min-w-[200px]" asChild>
                <Link to={ROUTES.LOGIN}>
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 min-w-[200px]"
                asChild
              >
                <Link to={ROUTES.PLANS}>View Plans</Link>
              </Button>
            </motion.div>

            <motion.p
              className="mt-5 text-sm text-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              Free to register. No credit card required.
            </motion.p>
          </div>

          {/* Right: Couple image with premium framing */}
          <motion.div
            className="relative mx-auto lg:mx-0 w-full max-w-md lg:max-w-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          >
            {/* Gold glow behind image — static, GPU-layered */}
            <div
              className="absolute -inset-4 bg-gradient-to-br from-accent-400/20 via-accent-500/10 to-transparent rounded-[2rem] blur-2xl transform-gpu"
              style={{ willChange: 'transform' }}
            />

            {/* Decorative gold corner accents */}
            <div className="absolute -top-3 -left-3 h-16 w-16 border-t-2 border-l-2 border-accent-400/60 rounded-tl-2xl" />
            <div className="absolute -bottom-3 -right-3 h-16 w-16 border-b-2 border-r-2 border-accent-400/60 rounded-br-2xl" />

            {/* Image frame */}
            <motion.div
              className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transform-gpu"
              style={{ willChange: 'transform' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img
                src="/marriedcouple.png"
                alt="Happy Tamil couple"
                className="w-full h-auto object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              {/* Subtle inner vignette for premium feel */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary-950/30 via-transparent to-transparent pointer-events-none" />
            </motion.div>

            {/* Floating heart badge */}
            <motion.div
              className="absolute -bottom-5 -left-5 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-4 py-2.5 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <Heart className="h-4 w-4 fill-primary-700 text-primary-700" />
              <span className="text-xs font-semibold text-primary-900">Made with love</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to warm background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-warm-50 to-transparent" />
    </section>
  );
}

/* ─────────────────────────────────────────── */
/*  Stats                                       */
/* ─────────────────────────────────────────── */

const EARLY_STAGE_STATS = [
  { text: 'Exclusive Launch', label: 'Founded 2026' },
  { text: 'Phone Verified', label: 'Every Single Profile' },
  { text: '12+ Countries', label: 'Global Tamil Diaspora' },
  { text: 'Family First', label: 'Built for Tamil Families' },
];

function StatsSection() {
  const { data } = useStats();
  const totalProfiles = data?.success ? data.data.totalProfiles : 0;
  const isEarlyStage = totalProfiles < 50;

  if (isEarlyStage) {
    return (
      <section className="relative -mt-12 z-10">
        <div className="page-container">
          <AnimatedSection>
            <div className="rounded-2xl bg-white shadow-soft-xl border border-border/50 p-8 sm:p-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {EARLY_STAGE_STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="font-heading text-xl sm:text-2xl font-bold text-primary-800">
                      {stat.text}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    );
  }

  const stats = [
    { value: data!.data.totalProfiles, suffix: '+', label: 'Registered Profiles' },
    { value: data!.data.successfulMatches, suffix: '+', label: 'Successful Matches' },
    { value: data!.data.countriesReached, suffix: '+', label: 'Countries Reached' },
    { value: data!.data.verifiedPercentage, suffix: '%', label: 'Verified Profiles' },
  ];

  return (
    <section className="relative -mt-12 z-10">
      <div className="page-container">
        <AnimatedSection>
          <div className="rounded-2xl bg-white shadow-soft-xl border border-border/50 p-8 sm:p-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-heading text-3xl sm:text-4xl font-bold text-primary-800">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── */
/*  Features                                    */
/* ─────────────────────────────────────────── */

function FeaturesSection() {
  return (
    <section className="section-spacing bg-warm-50" id="features">
      <div className="page-container">
        <AnimatedSection className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            Why Choose Us
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Built with Care for the Tamil Community
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Every feature is thoughtfully designed to honour your traditions while making the search
            for your life partner effortless.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <Card className="h-full hover-lift border-0 shadow-soft group">
                <CardContent className="pt-8 pb-6 text-center">
                  <div
                    className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition-transform group-hover:scale-110`}
                  >
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── */
/*  How It Works                                */
/* ─────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Create Your Profile',
      desc: 'Share your story, cultural background, values, and what you seek in a life partner. Your family can create a profile on your behalf too.',
      icon: Users,
    },
    {
      step: '02',
      title: 'Discover Matches',
      desc: 'Browse profiles with smart filters, get personalised recommendations based on compatibility, and find people who share your values.',
      icon: Sparkles,
    },
    {
      step: '03',
      title: 'Connect & Chat',
      desc: 'Send interests, start meaningful conversations, and build the connection that leads to a lifetime together.',
      icon: Heart,
    },
  ];

  return (
    <section className="section-spacing bg-white" id="how-it-works">
      <div className="page-container">
        <AnimatedSection className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            Simple Process
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Three Steps to Your Partner
          </h2>
          <p className="mt-4 text-muted-foreground">Your journey to finding the one, simplified</p>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {steps.map((item, index) => (
            <StaggerItem key={item.step}>
              <div className="relative text-center group">
                {/* Connector line on desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary-200 to-primary-100" />
                )}

                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary text-white shadow-glow transition-transform group-hover:scale-105">
                  <item.icon className="h-9 w-9" />
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white shadow-gold-glow">
                    {item.step}
                  </span>
                </div>

                <h3 className="font-heading font-semibold text-xl">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <AnimatedSection delay={0.4} className="mt-14 text-center">
          <Button size="lg" className="group" asChild>
            <Link to={ROUTES.LOGIN}>
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── */
/*  Success Stories                             */
/* ─────────────────────────────────────────── */

interface SuccessStory {
  storyId: string;
  names: string;
  location: string;
  story: string;
  initials: string;
}

function SuccessStoriesSection() {
  const { data: response } = useQuery({
    queryKey: ['success-stories'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ items: SuccessStory[]; count: number }>>('/success-stories')
        .then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const stories = response?.success ? response.data.items : [];

  return (
    <section className="section-spacing bg-warm-50" id="success-stories">
      <div className="page-container">
        <AnimatedSection className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            <Heart className="mr-1.5 h-3 w-3 fill-primary-400 text-primary-400" />
            Love Stories
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Families That Found Each Other
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Real stories from real families. Every match is a new beginning.
          </p>
        </AnimatedSection>

        {stories.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.map((story) => (
              <StaggerItem key={story.storyId || story.names}>
                <Card className="h-full border-0 shadow-soft hover-lift">
                  <CardContent className="pt-8 pb-6">
                    <Quote className="h-8 w-8 text-primary-200 mb-4" />
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      &ldquo;{story.story}&rdquo;
                    </p>
                    <Separator className="my-5" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-white font-heading font-bold text-sm">
                        {story.initials}
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-sm">{story.names}</p>
                        <p className="text-xs text-muted-foreground">{story.location}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <AnimatedSection>
            <Card className="border-0 shadow-soft max-w-lg mx-auto">
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
                  <Heart className="h-7 w-7 text-primary-300" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  Your Story Could Be Here
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  We are a new platform building meaningful connections for the Tamil community. Join us and be part of our first success stories.
                </p>
                <Button className="mt-6 rounded-xl" asChild>
                  <Link to={ROUTES.LOGIN}>
                    <Heart className="mr-2 h-4 w-4" />
                    Start Your Journey
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── */
/*  Plans                                       */
/* ─────────────────────────────────────────── */

function PlansSection() {
  const [showComparison, setShowComparison] = useState(false);
  return (
    <section className="section-spacing bg-white" id="plans">
      <div className="page-container">
        <AnimatedSection className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            Pricing
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Start free and upgrade when you are ready. Every plan brings you closer to your perfect
            match.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.filter((p) => p.name !== 'Silver').map((plan) => (
            <StaggerItem key={plan.name}>
              <Card
                className={`h-full relative hover-lift ${
                  plan.popular ? 'border-2 border-primary-700 shadow-glow' : 'border-0 shadow-soft'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-4 py-1 shadow-glow">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6">
                  <h3 className="font-heading font-bold text-xl text-center">{plan.name}</h3>

                  <div className="mt-4 text-center">
                    <span className="font-heading text-4xl font-bold text-primary-800">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>

                  <Separator className="my-6" />

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-8"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    asChild
                  >
                    <Link to={ROUTES.LOGIN}>{plan.popular ? 'Get Started' : 'Choose Plan'}</Link>
                  </Button>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <AnimatedSection delay={0.3} className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include free registration and basic profile browsing.{' '}
            <button
              onClick={() => setShowComparison((v) => !v)}
              className="text-primary-700 hover:underline font-medium"
            >
              {showComparison ? 'Hide comparison' : 'Compare plans in detail'}
            </button>
          </p>
        </AnimatedSection>

        <AnimatePresence initial={false}>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 max-w-4xl mx-auto overflow-hidden"
            >
              <Card className="border-0 shadow-soft-lg rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-warm-50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs w-[200px]">
                          Feature
                        </th>
                        <th className="text-center py-3 px-3 font-medium text-xs w-[90px]">
                          <span className="text-muted-foreground">Free</span>
                        </th>
                        <th className="text-center py-3 px-3 font-medium text-xs w-[90px]">
                          <span className="text-accent-600 font-semibold">Gold</span>
                        </th>
                        <th className="text-center py-3 px-3 font-medium text-xs w-[90px]">
                          <span className="text-violet-600">Platinum</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {COMPARISON_FEATURES.map((row) => (
                        <tr key={row.label} className="hover:bg-warm-50/50 transition-colors">
                          <td className="py-3 px-4 text-xs text-foreground font-medium">{row.label}</td>
                          {(['free', 'gold', 'platinum'] as const).map((tier) => {
                            const val = row[tier];
                            return (
                              <td key={tier} className="text-center py-3 px-3">
                                {val === true ? (
                                  <div className="flex justify-center">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    </div>
                                  </div>
                                ) : val === false ? (
                                  <div className="flex justify-center">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50">
                                      <X className="h-3 w-3 text-red-400" />
                                    </div>
                                  </div>
                                ) : (
                                  <span
                                    className={
                                      tier === 'gold'
                                        ? 'text-xs font-medium text-accent-700'
                                        : tier === 'platinum'
                                        ? 'text-xs font-medium text-violet-700'
                                        : 'text-xs font-medium text-foreground'
                                    }
                                  >
                                    {val}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="bg-warm-50/50 border-t-2">
                        <td className="py-3 px-4 text-xs font-semibold text-foreground">Monthly price</td>
                        <td className="text-center py-3 px-3 text-xs font-bold text-foreground">Free</td>
                        <td className="text-center py-3 px-3 text-xs font-bold text-accent-700">£19.99</td>
                        <td className="text-center py-3 px-3 text-xs font-bold text-violet-700">£29.99</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

const COMPARISON_FEATURES: Array<{
  label: string;
  free: string | boolean;
  gold: string | boolean;
  platinum: string | boolean;
}> = [
  { label: 'Profile views/month', free: '10', gold: '25', platinum: '30' },
  { label: 'Interests/month', free: '5', gold: '25', platinum: '30' },
  { label: 'Chat access', free: false, gold: true, platinum: true },
  { label: 'Contact info visible', free: false, gold: true, platinum: true },
  { label: 'Who viewed me', free: false, gold: 'Full details', platinum: 'Full details' },
  { label: 'Photo uploads', free: '3 max', gold: '6 max', platinum: '6 max' },
  { label: "View other's photos", free: '1 photo', gold: '4 photos', platinum: 'All photos' },
  { label: 'Photo visibility controls', free: false, gold: true, platinum: true },
  { label: 'Profile boost', free: false, gold: '1/month', platinum: '3/month' },
  { label: 'Priority in search', free: false, gold: false, platinum: true },
];

/* ─────────────────────────────────────────── */
/*  CTA                                         */
/* ─────────────────────────────────────────── */

function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white section-spacing"
      style={{ isolation: 'isolate', contain: 'paint' }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ transform: 'translateZ(0)' }}>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-accent-400/10 blur-[100px] transform-gpu"
          style={{ willChange: 'transform' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="page-container relative text-center">
        <AnimatedSection>
          <motion.div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart className="h-8 w-8 fill-accent-400 text-accent-400" />
          </motion.div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold max-w-2xl mx-auto leading-tight">
            Your Perfect Match{' '}
            <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
              is Waiting
            </span>
          </h2>

          <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Join Tamil families worldwide who are finding their happily ever after. Your story could be
            next.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" variant="gold" className="group min-w-[200px]" asChild>
              <Link to={ROUTES.LOGIN}>
                Begin Your Story
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-white/30">
            {CONFIG.APP_NAME} — {CONFIG.APP_TAGLINE}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
