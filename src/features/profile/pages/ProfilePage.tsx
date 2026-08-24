import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserRound, Plus, Trash2, Award, Briefcase, CheckCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { LearnerHeader } from "@/layouts/LearnerHeader";
import { avatarColor } from "@/features/users/lib/userVisuals";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface WorkExpItem {
  role: string;
  org: string;
  years: number;
}

interface CertificateItem {
  title: string;
  issuer: string;
  year: number;
}

export function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [qualificationsText, setQualificationsText] = useState("");
  const [skillsText, setSkillsText] = useState("");
  
  // Trainee fields
  const [interestsText, setInterestsText] = useState("");
  const [workExperience, setWorkExperience] = useState<WorkExpItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  
  // Dynamic item fields for adding
  const [newRole, setNewRole] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newYears, setNewYears] = useState(0);

  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertYear, setNewCertYear] = useState(new Date().getFullYear());

  // Trainer fields
  const [experienceYears, setExperienceYears] = useState(0);
  const [subjectsText, setSubjectsText] = useState("");

  const isTrainer = user?.roles.includes("Trainer");
  const isTrainee = user?.roles.includes("Trainee");

  // Fetch Profile data from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData(data);
          
          // Initialize form states
          setQualificationsText(data.qualifications?.join(", ") || "");
          setSkillsText(data.skills?.join(", ") || "");
          
          if (isTrainee) {
            setInterestsText(data.interests?.join(", ") || "");
            setWorkExperience(data.workExperience || []);
            setCertificates(data.certificates || []);
          }

          if (isTrainer) {
            setExperienceYears(data.experienceYears || 0);
            setSubjectsText(data.subjectsHandled?.join(", ") || "");
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError("Failed to load your profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, isTrainee, isTrainer]);

  // Add Dynamic Work Experience
  const addWorkExperience = () => {
    if (!newRole.trim() || !newOrg.trim()) return;
    const item: WorkExpItem = {
      role: newRole.trim(),
      org: newOrg.trim(),
      years: Number(newYears) || 0
    };
    setWorkExperience([...workExperience, item]);
    setNewRole("");
    setNewOrg("");
    setNewYears(0);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, idx) => idx !== index));
  };

  // Add Dynamic Certificate
  const addCertificate = () => {
    if (!newCertTitle.trim() || !newCertIssuer.trim()) return;
    const item: CertificateItem = {
      title: newCertTitle.trim(),
      issuer: newCertIssuer.trim(),
      year: Number(newCertYear) || new Date().getFullYear()
    };
    setCertificates([...certificates, item]);
    setNewCertTitle("");
    setNewCertIssuer("");
    setNewCertYear(new Date().getFullYear());
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, idx) => idx !== index));
  };

  // Save changes to Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Parse comma-separated fields to string arrays
    const qualifications = qualificationsText
      .split(",")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updatePayload: any = {
      qualifications,
      skills,
    };

    if (isTrainee) {
      const interests = interestsText
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      updatePayload.interests = interests;
      updatePayload.workExperience = workExperience;
      updatePayload.certificates = certificates;
    }

    if (isTrainer) {
      const subjectsHandled = subjectsText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      updatePayload.experienceYears = Number(experienceYears) || 0;
      updatePayload.subjectsHandled = subjectsHandled;
    }

    try {
      await updateDoc(doc(db, "users", user.id), updatePayload);
      setSuccess(true);
    } catch (err) {
      console.error("Save profile failed:", err);
      setError("Failed to save your profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <LearnerHeader />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>

        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <UserRound className="h-6 w-6 text-primary" aria-hidden />
          Your Capacity Profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure your qualifications, meteorological skills, and experience metrics below.
        </p>

        {error && <Alert variant="error" className="mt-6">{error}</Alert>}
        {success && (
          <Alert variant="success" className="mt-6 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span>Profile settings saved successfully.</span>
          </Alert>
        )}

        {loading ? (
          <Skeleton className="mt-6 h-64 rounded-[18px]" />
        ) : profileData ? (
          <form onSubmit={handleSaveProfile} className="space-y-6 mt-6">
            
            {/* Base info summary */}
            <section className="flex flex-wrap items-center gap-5 rounded-[18px] border border-border bg-card p-6 shadow-soft">
              <Avatar
                name={profileData.fullName}
                src={profileData.avatarUrl}
                color={avatarColor(profileData.email)}
                size="xl"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">{profileData.fullName}</h2>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profileData.roles?.map((role: string) => (
                    <Badge key={role} variant="neutral">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </section>

            {/* Core details editable for all */}
            <section className="rounded-[18px] border border-border bg-card p-6 shadow-soft space-y-4">
              <h2 className="font-semibold text-lg border-b border-border pb-1.5">Qualifications & Skills</h2>
              
              <div className="space-y-1.5">
                <Label htmlFor="qualifications">Academic Qualifications</Label>
                <Input 
                  id="qualifications"
                  value={qualificationsText}
                  onChange={(e) => setQualificationsText(e.target.value)}
                  placeholder="e.g. M.Sc in Meteorology, B.Tech in Remote Sensing (comma separated)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="skills">Meteorological Skills & Tools</Label>
                <Input 
                  id="skills"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. Python, Doppler Radar, GIS, WRF Modeling (comma separated)"
                />
                {skillsText && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skillsText.split(",").map((s, idx) => s.trim() && (
                      <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {s.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Trainee profile sections */}
            {isTrainee && (
              <>
                <section className="rounded-[18px] border border-border bg-card p-6 shadow-soft space-y-4">
                  <h2 className="font-semibold text-lg border-b border-border pb-1.5">Interests</h2>
                  <div className="space-y-1.5">
                    <Label htmlFor="interests">Interests & Research Areas</Label>
                    <Input 
                      id="interests"
                      value={interestsText}
                      onChange={(e) => setInterestsText(e.target.value)}
                      placeholder="e.g. Numerical Weather Prediction, Satellite Met (comma separated)"
                    />
                  </div>
                </section>

                <section className="rounded-[18px] border border-border bg-card p-6 shadow-soft space-y-4">
                  <h2 className="font-semibold text-lg border-b border-border pb-1.5 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Work Experience
                  </h2>

                  {workExperience.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {workExperience.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center rounded-lg border border-border p-3 bg-muted/10 text-sm">
                          <div>
                            <span className="font-semibold text-foreground">{item.role}</span> at {item.org}
                            <span className="block text-xs text-muted-foreground">{item.years} Years</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeWorkExperience(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3 items-end border-t border-border/50 pt-3">
                    <div className="space-y-1.5">
                      <Label>Job Role</Label>
                      <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Asst. Meteorologist" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Organization / Office</Label>
                      <Input value={newOrg} onChange={(e) => setNewOrg(e.target.value)} placeholder="e.g. Regional Met Office" />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 space-y-1.5">
                        <Label>Years</Label>
                        <Input type="number" value={newYears || ""} onChange={(e) => setNewYears(Number(e.target.value))} placeholder="Years" />
                      </div>
                      <Button type="button" size="icon" variant="outline" className="h-10 w-10 mt-6" onClick={addWorkExperience}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="rounded-[18px] border border-border bg-card p-6 shadow-soft space-y-4">
                  <h2 className="font-semibold text-lg border-b border-border pb-1.5 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Uploaded Certificates
                  </h2>

                  {certificates.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {certificates.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center rounded-lg border border-border p-3 bg-muted/10 text-sm">
                          <div>
                            <span className="font-semibold text-foreground">{item.title}</span> - issued by {item.issuer} ({item.year})
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeCertificate(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3 items-end border-t border-border/50 pt-3">
                    <div className="space-y-1.5">
                      <Label>Certificate Title</Label>
                      <Input value={newCertTitle} onChange={(e) => setNewCertTitle(e.target.value)} placeholder="e.g. Advanced Doppler Radar" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Issuer</Label>
                      <Input value={newCertIssuer} onChange={(e) => setNewCertIssuer(e.target.value)} placeholder="e.g. IMD Pune" />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 space-y-1.5">
                        <Label>Year</Label>
                        <Input type="number" value={newCertYear || ""} onChange={(e) => setNewCertYear(Number(e.target.value))} />
                      </div>
                      <Button type="button" size="icon" variant="outline" className="h-10 w-10 mt-6" onClick={addCertificate}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Trainer profile sections */}
            {isTrainer && (
              <>
                <section className="rounded-[18px] border border-border bg-card p-6 shadow-soft space-y-4">
                  <h2 className="font-semibold text-lg border-b border-border pb-1.5">Expertise Metrics</h2>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="experience">Experience in Years (Meteorological Training)</Label>
                    <Input 
                      id="experience"
                      type="number"
                      value={experienceYears || ""}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      placeholder="e.g. 10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subjects">Subjects Handled</Label>
                    <Input 
                      id="subjects"
                      value={subjectsText}
                      onChange={(e) => setSubjectsText(e.target.value)}
                      placeholder="e.g. Tropical Cyclones, Severe Storm dynamics (comma separated)"
                    />
                  </div>
                </section>
              </>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={saving} className="px-6">
                Save Profile Details
              </Button>
            </div>
          </form>
        ) : null}
      </main>
    </div>
  );
}


