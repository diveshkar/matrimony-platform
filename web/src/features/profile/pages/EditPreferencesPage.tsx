import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Heart, Ruler, Globe, GraduationCap, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiSelect } from '@/components/ui/multi-select';
import { useMyProfile, useUpdateProfile } from '../hooks/useProfile';
import { useToast } from '@/components/ui/toaster';
import { ROUTES } from '@/lib/constants/routes';
import {
  RELIGION_OPTIONS,
  CASTE_OPTIONS,
  COUNTRY_OPTIONS,
  EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from '@/lib/constants/enums';

const allCasteOptions = Object.values(CASTE_OPTIONS)
  .flat()
  .filter((v, i, a) => a.findIndex((x) => x.value === v.value) === i);

interface Preferences {
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  religions?: string[];
  castes?: string[];
  educations?: string[];
  countries?: string[];
  maritalStatuses?: string[];
}

export default function EditPreferencesPage() {
  const { data: response, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const [prefs, setPrefs] = useState<Preferences>({ ageMin: 18, ageMax: 45 });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (response?.success && response.data.preferences) {
      setPrefs(response.data.preferences as Preferences);
    }
  }, [response]);

  const update = (key: string, value: unknown) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ preferences: { ageMin: prefs.ageMin || 18, ageMax: prefs.ageMax || 45, ...prefs } });
      setHasChanges(false);
      toast.success('Preferences saved', 'Your matching preferences have been updated');
    } catch {
      toast.error('Save failed', 'Could not save preferences. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 max-w-xl mx-auto">
        <p className="text-muted-foreground">Could not load your preferences.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl" asChild>
          <Link to={ROUTES.MY_PROFILE}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Partner Preferences</h1>
          <p className="text-xs text-muted-foreground">Define what you're looking for in a partner</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Age Range */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Heart className="h-4 w-4 text-primary-700" />
                </div>
                Age Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={18}
                  max={70}
                  value={prefs.ageMin ?? ''}
                  onChange={(e) => update('ageMin', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="18"
                  className="w-24 h-11 rounded-xl text-center"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="number"
                  min={18}
                  max={70}
                  value={prefs.ageMax ?? ''}
                  onChange={(e) => update('ageMax', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="45"
                  className="w-24 h-11 rounded-xl text-center"
                />
                <span className="text-sm text-muted-foreground">years</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Height Range */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Ruler className="h-4 w-4 text-primary-700" />
                </div>
                Height Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={120}
                  max={220}
                  value={prefs.heightMin || ''}
                  onChange={(e) => update('heightMin', Number(e.target.value) || undefined)}
                  placeholder="Min"
                  className="w-24 h-11 rounded-xl text-center"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="number"
                  min={120}
                  max={220}
                  value={prefs.heightMax || ''}
                  onChange={(e) => update('heightMax', Number(e.target.value) || undefined)}
                  placeholder="Max"
                  className="w-24 h-11 rounded-xl text-center"
                />
                <span className="text-sm text-muted-foreground">cm</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferred Religions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Heart className="h-4 w-4 text-primary-700" />
                </div>
                Preferred Religion(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelect
                options={RELIGION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={prefs.religions || []}
                onChange={(val) => update('religions', val)}
                placeholder="Select religions..."
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferred Castes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Users2 className="h-4 w-4 text-primary-700" />
                </div>
                Preferred Caste(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelect
                options={allCasteOptions}
                value={prefs.castes || []}
                onChange={(val) => update('castes', val)}
                placeholder="Select castes..."
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferred Countries */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Globe className="h-4 w-4 text-primary-700" />
                </div>
                Preferred Country(ies)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelect
                options={COUNTRY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={prefs.countries || []}
                onChange={(val) => update('countries', val)}
                placeholder="Select countries..."
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferred Education */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <GraduationCap className="h-4 w-4 text-primary-700" />
                </div>
                Preferred Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelect
                options={EDUCATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={prefs.educations || []}
                onChange={(val) => update('educations', val)}
                placeholder="Select education levels..."
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferred Marital Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Heart className="h-4 w-4 text-primary-700" />
                </div>
                Preferred Marital Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelect
                options={MARITAL_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={prefs.maritalStatuses || []}
                onChange={(val) => update('maritalStatuses', val)}
                placeholder="Select marital status..."
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 backdrop-blur-md shadow-soft-xl px-4 py-3"
        >
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unsaved changes</p>
            <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-xl">
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
