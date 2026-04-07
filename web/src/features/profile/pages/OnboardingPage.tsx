import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/lib/constants/routes';
import { useCreateProfile } from '../hooks/useProfile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ProfileData } from '../api/profile-api';

import { StepProfileFor } from '../components/onboarding/StepProfileFor';
import { StepBasicInfo } from '../components/onboarding/StepBasicInfo';
import { StepCulturalRoots } from '../components/onboarding/StepCulturalRoots';
import { StepEducationCareer } from '../components/onboarding/StepEducationCareer';
import { StepLocation } from '../components/onboarding/StepLocation';
import { StepFamily } from '../components/onboarding/StepFamily';
import { StepPhoneVerify } from '../components/onboarding/StepPhoneVerify';
import { StepPreferences } from '../components/onboarding/StepPreferences';
import { StepAboutMe } from '../components/onboarding/StepAboutMe';

const STEPS = [
  { title: 'Profile For', subtitle: 'Who is this profile for?' },
  { title: 'Basic Info', subtitle: "Let's start with you" },
  { title: 'Cultural Roots', subtitle: 'Your heritage matters' },
  { title: 'Education & Career', subtitle: 'Your achievements' },
  { title: 'Location', subtitle: 'Where you call home' },
  { title: 'Family', subtitle: 'Your family story' },
  { title: 'Verify Phone', subtitle: 'Build trust with your number' },
  { title: 'Partner Preferences', subtitle: 'Who you are looking for' },
  { title: 'About You', subtitle: 'In your own words' },
];

const DRAFT_KEY = 'matrimony_onboarding_draft';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useLocalStorage<Partial<ProfileData>>(DRAFT_KEY, {});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const createProfile = useCreateProfile();

  const updateDraft = useCallback(
    (updates: Partial<ProfileData>) => {
      setDraft((prev) => ({ ...prev, ...updates }));
      setStepErrors({});
    },
    [setDraft],
  );

  const validateStep = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 0:
        if (!draft.profileFor) errors.profileFor = 'Please select who this profile is for';
        break;
      case 1:
        if (!draft.name?.trim()) errors.name = 'Name is required';
        if (!draft.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!draft.gender) errors.gender = 'Gender is required';
        if (!draft.height) errors.height = 'Height is required';
        if (!draft.maritalStatus) errors.maritalStatus = 'Marital status is required';
        break;
      case 2:
        if (!draft.religion) errors.religion = 'Religion is required';
        if (!draft.motherTongue) errors.motherTongue = 'Mother tongue is required';
        break;
      case 3:
        if (!draft.education) errors.education = 'Education is required';
        break;
      case 4:
        if (!draft.country) errors.country = 'Country is required';
        break;
      case 6:
        if (!draft.phoneNumber || draft.phoneNumber.length < 8) errors.phoneNumber = 'A valid phone number is required';
        break;
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, draft]);

  const handleNext = useCallback(() => {
    if (!validateStep()) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setStepErrors({});
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return;

    const profileData: ProfileData = {
      profileFor: draft.profileFor || 'self',
      name: draft.name || '',
      dateOfBirth: draft.dateOfBirth || '',
      gender: draft.gender || 'male',
      height: draft.height || 170,
      maritalStatus: draft.maritalStatus || 'never_married',
      hasChildren: draft.hasChildren || false,
      childrenCount: draft.childrenCount,
      phoneNumber: draft.phoneNumber,
      religion: draft.religion || '',
      caste: draft.caste,
      subCaste: draft.subCaste,
      denomination: draft.denomination,
      motherTongue: draft.motherTongue || '',
      gothram: draft.gothram,
      education: draft.education || '',
      educationField: draft.educationField,
      occupation: draft.occupation,
      employer: draft.employer,
      incomeRange: draft.incomeRange,
      country: draft.country || '',
      state: draft.state,
      city: draft.city,
      fatherOccupation: draft.fatherOccupation,
      motherOccupation: draft.motherOccupation,
      brothersCount: draft.brothersCount,
      brothersMarried: draft.brothersMarried,
      sistersCount: draft.sistersCount,
      sistersMarried: draft.sistersMarried,
      familyType: draft.familyType,
      familyStatus: draft.familyStatus,
      familyValues: draft.familyValues,
      aboutMe: draft.aboutMe,
      preferences: draft.preferences,
    };

    try {
      await createProfile.mutateAsync(profileData);
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* handled by mutation */
    }
  }, [draft, validateStep, createProfile]);

  const isLastStep = currentStep === STEPS.length - 1;

  if (user?.onboardingComplete) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-[80vh] py-6 sm:py-8">
      <div className="max-w-xl mx-auto px-4">
        {/* Step dots + progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'h-2 w-8 bg-primary-700'
                    : i < currentStep
                      ? 'h-2 w-2 bg-primary-400'
                      : 'h-2 w-2 bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step title */}
        <motion.div
          key={`title-${currentStep}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            {STEPS[currentStep].title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {STEPS[currentStep].subtitle}
          </p>
        </motion.div>

        {/* Step content wrapped in card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 0 && (
              <StepProfileFor data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 1 && (
              <StepBasicInfo data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 2 && (
              <StepCulturalRoots data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 3 && (
              <StepEducationCareer data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 4 && (
              <StepLocation data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 5 && (
              <StepFamily data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 6 && (
              <StepPhoneVerify data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 7 && (
              <StepPreferences data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
            {currentStep === 8 && (
              <StepAboutMe data={draft} onChange={updateDraft} errors={stepErrors} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={createProfile.isPending}
              className="gap-2 min-w-[160px] rounded-xl"
              size="lg"
            >
              {createProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Complete Profile
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2 rounded-xl" size="lg">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {createProfile.isError && (
          <p className="mt-4 text-sm text-destructive text-center">
            Failed to create profile. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
