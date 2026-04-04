import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useMyProfile, useUpdateProfile } from '../hooks/useProfile';
import { ROUTES } from '@/lib/constants/routes';
import {
  RELIGION_OPTIONS,
  CASTE_OPTIONS,
  DENOMINATION_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  EDUCATION_OPTIONS,
  EDUCATION_FIELD_OPTIONS,
  OCCUPATION_OPTIONS,
  INCOME_OPTIONS,
  COUNTRY_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  FAMILY_STATUS_OPTIONS,
  FAMILY_VALUES_OPTIONS,
  HEIGHT_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  GENDER_OPTIONS,
} from '@/lib/constants/enums';

const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function EditProfilePage() {
  const { data: response, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile data into form
  useEffect(() => {
    if (response?.success) {
      const p = response.data.profile;
      setForm({ ...p });
    }
  }, [response]);

  const update = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Remove DynamoDB keys from update
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      PK: _pk,
      SK: _sk,
      userId: _uid,
      schemaVersion: _sv,
      createdAt: _ca,
      updatedAt: _ua,
      profileCompletion: _pc,
      ...updates
    } = form;
    await updateProfile.mutateAsync(updates);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const casteOptions = form.religion ? CASTE_OPTIONS[form.religion as string] || [] : [];
  const denomOptions = form.religion ? DENOMINATION_OPTIONS[form.religion as string] || [] : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to={ROUTES.MY_PROFILE}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Profile
        </Link>
      </Button>

      <PageHeader
        title="Edit Profile"
        action={
          <Button onClick={handleSave} disabled={!hasChanges || updateProfile.isPending}>
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        }
      />

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name">
            <Input
              value={(form.name as string) || ''}
              onChange={(e) => update('name', e.target.value)}
            />
          </Field>
          <Field label="Date of Birth">
            <Input
              type="date"
              value={(form.dateOfBirth as string) || ''}
              onChange={(e) => update('dateOfBirth', e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <select
              value={(form.gender as string) || ''}
              onChange={(e) => update('gender', e.target.value)}
              className={selectClass}
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Height">
            <select
              value={String(form.height || '')}
              onChange={(e) => update('height', Number(e.target.value))}
              className={selectClass}
            >
              <option value="">Select</option>
              {HEIGHT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Marital Status">
            <select
              value={(form.maritalStatus as string) || ''}
              onChange={(e) => update('maritalStatus', e.target.value)}
              className={selectClass}
            >
              {MARITAL_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            These are visible only to Gold and Platinum members.
          </p>
          <Field label="WhatsApp Number">
            <Input
              value={(form.whatsappNumber as string) || ''}
              onChange={(e) => update('whatsappNumber', e.target.value)}
              placeholder="+447911123456"
            />
          </Field>
          <Field label="Personal Email">
            <Input
              type="email"
              value={(form.personalEmail as string) || ''}
              onChange={(e) => update('personalEmail', e.target.value)}
              placeholder="your.email@example.com"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Cultural */}
      <Card>
        <CardHeader>
          <CardTitle>Cultural Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Religion">
            <select
              value={(form.religion as string) || ''}
              onChange={(e) => update('religion', e.target.value)}
              className={selectClass}
            >
              {RELIGION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {casteOptions.length > 0 && (
            <Field label="Caste">
              <select
                value={(form.caste as string) || ''}
                onChange={(e) => update('caste', e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                {casteOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {denomOptions.length > 0 && (
            <Field label="Denomination">
              <select
                value={(form.denomination as string) || ''}
                onChange={(e) => update('denomination', e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                {denomOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Mother Tongue">
            <select
              value={(form.motherTongue as string) || ''}
              onChange={(e) => update('motherTongue', e.target.value)}
              className={selectClass}
            >
              {MOTHER_TONGUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gothram">
            <Input
              value={(form.gothram as string) || ''}
              onChange={(e) => update('gothram', e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Education & Career */}
      <Card>
        <CardHeader>
          <CardTitle>Education & Career</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Education">
            <select
              value={(form.education as string) || ''}
              onChange={(e) => update('education', e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {EDUCATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Field of Study">
            <select
              value={(form.educationField as string) || ''}
              onChange={(e) => update('educationField', e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {EDUCATION_FIELD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Occupation">
            <select
              value={(form.occupation as string) || ''}
              onChange={(e) => update('occupation', e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {OCCUPATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employer">
            <Input
              value={(form.employer as string) || ''}
              onChange={(e) => update('employer', e.target.value)}
              placeholder="Company name"
            />
          </Field>
          <Field label="Income">
            <select
              value={(form.incomeRange as string) || ''}
              onChange={(e) => update('incomeRange', e.target.value)}
              className={selectClass}
            >
              <option value="">Prefer not to say</option>
              {INCOME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Country">
            <select
              value={(form.country as string) || ''}
              onChange={(e) => update('country', e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {COUNTRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="State / Province">
            <Input
              value={(form.state as string) || ''}
              onChange={(e) => update('state', e.target.value)}
            />
          </Field>
          <Field label="City">
            <Input
              value={(form.city as string) || ''}
              onChange={(e) => update('city', e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Family */}
      <Card>
        <CardHeader>
          <CardTitle>Family</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Father's Occupation">
            <Input
              value={(form.fatherOccupation as string) || ''}
              onChange={(e) => update('fatherOccupation', e.target.value)}
            />
          </Field>
          <Field label="Mother's Occupation">
            <Input
              value={(form.motherOccupation as string) || ''}
              onChange={(e) => update('motherOccupation', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Brothers">
              <Input
                type="number"
                min={0}
                max={15}
                value={(form.brothersCount as number) ?? ''}
                onChange={(e) => update('brothersCount', Number(e.target.value))}
              />
            </Field>
            <Field label="Sisters">
              <Input
                type="number"
                min={0}
                max={15}
                value={(form.sistersCount as number) ?? ''}
                onChange={(e) => update('sistersCount', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Family Type">
            <select
              value={(form.familyType as string) || ''}
              onChange={(e) => update('familyType', e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {FAMILY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Family Status">
            <select
              value={(form.familyStatus as string) || ''}
              onChange={(e) => update('familyStatus', e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {FAMILY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Family Values">
            <select
              value={(form.familyValues as string) || ''}
              onChange={(e) => update('familyValues', e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {FAMILY_VALUES_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      {/* About Me */}
      <Card>
        <CardHeader>
          <CardTitle>About Me</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={(form.aboutMe as string) || ''}
            onChange={(e) => update('aboutMe', e.target.value)}
            rows={5}
            maxLength={2000}
            className="flex w-full rounded-lg border border-input bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {((form.aboutMe as string) || '').length} / 2000
          </p>
        </CardContent>
      </Card>

      {/* Save button at bottom */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={!hasChanges || updateProfile.isPending} size="lg">
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
