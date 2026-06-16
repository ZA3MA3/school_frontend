import { useState, useEffect } from 'react';
//import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Link, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
//import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Moon, Sun, Plus, Trash2 } from 'lucide-react';
import { studentApi } from '@/lib/api';
import logo from '@/assets/mouktassab.png';

interface ClassItem {
  id: number;
  name: string;
  student_count: number;
}

type SignUpStep = 'details' | 'phone' | 'role' | 'teacher' | 'parent';

interface StudentData {
  first_name: string;
  last_name: string;
  enrollment_date: string;
  date_of_birth: string;
  gender: boolean;
}

export default function SignUpPage() {
  //const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  //const { login } = useAuth();

  const [step, setStep] = useState<SignUpStep>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Role selection state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Teacher form state
  const [hireDate, setHireDate] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [levelId, setLevelId] = useState('');
  const [classId, setClassId] = useState('');
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);

  // Parent form state
  const [occupation, setOccupation] = useState('');
  const [students, setStudents] = useState<StudentData[]>([
    { first_name: '', last_name: '', enrollment_date: '', date_of_birth: '', gender: true },
  ]);

  // ✅ On mount, restore step and roles from localStorage
  // (window.location.href reloads lose all React state)
  useEffect(() => {
    const stepParam = searchParams.get('step');

    // Restore roles from localStorage so they survive page reloads
    const storedRoles = localStorage.getItem('signup_selected_roles');
    if (storedRoles) {
      setSelectedRoles(JSON.parse(storedRoles));
    }

    if (stepParam === 'phone') {
      setStep('phone');
      const storedEmail = localStorage.getItem('pending_email');
      const storedFirstName = localStorage.getItem('signup_first_name');
      const storedLastName = localStorage.getItem('signup_last_name');
      const storedAddress = localStorage.getItem('signup_address');
      const storedDob = localStorage.getItem('signup_date_of_birth');
      if (storedEmail) setEmail(storedEmail);
      if (storedFirstName) setFirstName(storedFirstName);
      if (storedLastName) setLastName(storedLastName);
      if (storedAddress) setAddress(storedAddress);
      if (storedDob) setDateOfBirth(storedDob);
    } else if (stepParam === 'role') {
      setStep('role');
      setPhoneNumber('');
      setOtpCode('');
      setOtpSent(false);
    } else if (stepParam === 'teacher') {
      setStep('teacher');
    } else if (stepParam === 'parent') {
      setStep('parent');
    }
  }, [searchParams]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setIsLoading(true);
      setError('');
      try {
        localStorage.setItem('signup_first_name', firstName);
        localStorage.setItem('signup_last_name', lastName);
        localStorage.setItem('signup_address', address);
        localStorage.setItem('signup_date_of_birth', dateOfBirth);

        const { authApi } = await import('@/lib/api');
        const data = await authApi.googleAuth(credentialResponse.access_token);

        if (data.access && data.refresh) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          localStorage.setItem('pending_email', data.user.email);
          window.location.href = '/signup?step=phone';
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed');
    },
    scope: 'openid email profile',
  });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { otpApi } = await import('@/lib/api');
      await otpApi.sendOTP(phoneNumber);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { otpApi } = await import('@/lib/api');
      await otpApi.verifyOTP(phoneNumber, otpCode, email, firstName, lastName, address, dateOfBirth);
      // ✅ Use setStep directly — no page reload, no state loss
      setStep('role');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

 /* const goToPhoneStep = () => {
    if (!firstName || !lastName) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep('phone');
  };*/

  const goBack = () => {
    setStep('details');
    setOtpSent(false);
    setOtpCode('');
    setError('');
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setError('');
  };

  const handleRoleContinue = () => {
    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }
    // ✅ Store selected roles in localStorage so teacher submit can read them
    localStorage.setItem('signup_selected_roles', JSON.stringify(selectedRoles));
    setError('');

    if (selectedRoles.includes('teacher')) {
      // Always go to teacher first, then parent after (if both selected)
      setStep('teacher');
    } else if (selectedRoles.includes('parent')) {
      setStep('parent');
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { otpApi } = await import('@/lib/api');
      console.log('Sending data:', {
        hire_date: hireDate,
        specialization: specialization,
        level_id: levelId,
        class_id: classId
    });
      await otpApi.createTeacherProfile(hireDate, specialization, levelId, classId);

      // ✅ Check if also a parent — if so, go to parent step instead of login
      const storedRoles = localStorage.getItem('signup_selected_roles');
      const roles: string[] = storedRoles ? JSON.parse(storedRoles) : selectedRoles;

      if (roles.includes('parent')) {
        setStep('parent');
        setError('');
      } else {
        // Teacher only — clean up and go to login
        localStorage.removeItem('signup_selected_roles');
        localStorage.removeItem('signup_first_name');
        localStorage.removeItem('signup_last_name');
        localStorage.removeItem('signup_address');
        localStorage.removeItem('signup_date_of_birth');
        localStorage.removeItem('pending_email');
        window.location.href = '/login';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create teacher profile');
    } finally {
      setIsLoading(false);
    }
  };

  const addStudent = () => {
    setStudents([
      ...students,
      { first_name: '', last_name: '', enrollment_date: '', date_of_birth: '', gender: true },
    ]);
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof StudentData, value: string | boolean) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const validStudents = students.filter(
        (s) => s.first_name && s.last_name && s.enrollment_date
      );
      if (validStudents.length === 0) {
        setError('Please add at least one student');
        setIsLoading(false);
        return;
      }

      const { otpApi } = await import('@/lib/api');
      await otpApi.createParentStudent(occupation, validStudents);

      // ✅ Clean up all signup localStorage data before redirecting
      localStorage.removeItem('signup_selected_roles');
      localStorage.removeItem('signup_first_name');
      localStorage.removeItem('signup_last_name');
      localStorage.removeItem('signup_address');
      localStorage.removeItem('signup_date_of_birth');
      localStorage.removeItem('pending_email');

      window.location.href = '/login';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create parent profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Progress indicator helper
 /* const getProgressLabel = () => {
    const storedRoles: string[] = JSON.parse(
      localStorage.getItem('signup_selected_roles') || '[]'
    );
    const hasTeacher = storedRoles.includes('teacher') || selectedRoles.includes('teacher');
    const hasParent = storedRoles.includes('parent') || selectedRoles.includes('parent');

    if (step === 'teacher' && hasParent) return 'Step 1 of 2 — Teacher Information';
    if (step === 'parent' && hasTeacher) return 'Step 2 of 2 — Parent & Children Information';
    if (step === 'teacher') return 'Teacher Information';
    if (step === 'parent') return 'Parent & Children Information';
    return '';
  };*/

  const renderStep = () => {
    switch (step) {
      // ─────────────────────────────────────────────
      // STEP 1 — Basic Details
      // ─────────────────────────────────────────────
      case 'details':
        return (
       
          <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center ">
              
          <img 
            src={logo} 
            alt="Book icon"
            className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20"
          />

              </div>
              <CardTitle className="text-2xl text-center dark:text-white">Sign Up</CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                Create your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="dark:text-white">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="dark:text-white">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="dark:text-white">Address</Label>
                <Input
                  id="address"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="dark:text-white">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => googleLogin()}
                disabled={isLoading}
              >
                Sign up with Google
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
           {/*   <Button className="w-full" onClick={goToPhoneStep} disabled={isLoading}>
                Continue to Phone Verification
              </Button>*/}
              <p className="text-sm text-center text-muted-foreground dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </Card>
        );

      // ─────────────────────────────────────────────
      // STEP 2 — Phone Verification
      // ─────────────────────────────────────────────
      case 'phone':
        return (
          <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center ">
              
                <img 
            src={logo} 
            alt="Book icon"
            className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20"
          />
                
              </div>
              <CardTitle className="text-2xl text-center dark:text-white">
                Phone Verification
              </CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                {otpSent ? 'Enter the code sent to your phone' : 'Enter your phone number'}
              </CardDescription>
            </CardHeader>

            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!otpSent ? (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="dark:text-white">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+213551234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="otpCode" className="dark:text-white">Verification Code</Label>
                    <Input
                      id="otpCode"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {otpSent ? 'Verifying...' : 'Sending...'}
                    </>
                  ) : otpSent ? (
                    'Verify & Continue'
                  ) : (
                    'Send Code'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  Go Back
                </Button>
              </CardFooter>
            </form>
          </Card>
        );

      // ─────────────────────────────────────────────
      // STEP 3 — Role Selection
      // ─────────────────────────────────────────────
      case 'role':
        return (
          <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center dark:text-white">
                Select Your Role
              </CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                Choose one or both roles
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  variant={selectedRoles.includes('teacher') ? 'default' : 'outline'}
                  className="flex-1 h-20 text-lg"
                  onClick={() => handleRoleSelect('teacher')}
                >
                  👨‍🏫 Teacher
                </Button>
                <Button
                  variant={selectedRoles.includes('parent') ? 'default' : 'outline'}
                  className="flex-1 h-20 text-lg"
                  onClick={() => handleRoleSelect('parent')}
                >
                  👨‍👩‍👧 Parent
                </Button>
              </div>

              {selectedRoles.includes('teacher') && selectedRoles.includes('parent') && (
                <p className="text-sm text-center text-muted-foreground">
                  You'll fill in teacher details first, then add your children.
                </p>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                onClick={handleRoleContinue}
                disabled={isLoading || selectedRoles.length === 0}
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        );

      // ─────────────────────────────────────────────
      // STEP 4A — Teacher Information
      // ─────────────────────────────────────────────
      case 'teacher': {
        const storedRoles: string[] = JSON.parse(
          localStorage.getItem('signup_selected_roles') || '[]'
        );
        const isAlsoParent =
          storedRoles.includes('parent') || selectedRoles.includes('parent');

        return (
          <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
            <CardHeader className="space-y-1">
              {isAlsoParent && (
                <p className="text-xs text-center text-muted-foreground mb-1">
                  Step 1 of 2
                </p>
              )}
              <CardTitle className="text-2xl text-center dark:text-white">
                Teacher Information
              </CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                Enter your teaching details
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleTeacherSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="hireDate" className="dark:text-white">Hire Date *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization" className="dark:text-white">
                    Specialization *
                  </Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Mathematics"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="dark:text-white">
                    Level *
                  </Label>
                  <select
                    id="level"
                    value={levelId}
                    onChange={(e) => {
                      setLevelId(e.target.value);
                      setClassId('');
                      // Fetch classes for this level
                      if (e.target.value) {
                        studentApi.getAllClassesPublic(parseInt(e.target.value)).then((classes) => {
                          setAvailableClasses(classes);
                        }).catch(() => {
                          setAvailableClasses([]);
                        });
                      } else {
                        setAvailableClasses([]);
                      }
                    }}
                    className="w-full p-2 border rounded-md bg-white dark:bg-zinc-800 dark:border-zinc-700"
                    required
                  >
                    <option value="">Select a level</option>
                    {[ 
                      { id: 1, name: '1AP' },
                      { id: 2, name: '2AP' },
                      { id: 3, name: '3AP' },
                      { id: 4, name: '4AP' },
                      { id: 5, name: '5AP' },
                      { id: 6, name: '1AM' },
                      { id: 7, name: '2AM' },
                      { id: 8, name: '3AM' },
                      { id: 9, name: '4AM' },
                      { id: 10, name: '1AS' },
                      { id: 11, name: '2AS' },
                      { id: 12, name: '3AS' },
                    ].map((level) => (
                      <option key={level.id} value={level.id}>{level.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class" className="dark:text-white">
                    Class *
                  </Label>
                  <select
                    id="class"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white dark:bg-zinc-800 dark:border-zinc-700"
                    required
                    disabled={!levelId}
                  >
                    <option value="">Select a class</option>
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name} ({cls.student_count} students)</option>
                    ))}
                  </select>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isAlsoParent ? (
                    'Save & Continue to Parent Info →'
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        );
      }

      // ─────────────────────────────────────────────
      // STEP 4B — Parent & Children Information
      // ─────────────────────────────────────────────
      case 'parent': {
        const storedRoles: string[] = JSON.parse(
          localStorage.getItem('signup_selected_roles') || '[]'
        );
        const isAlsoTeacher =
          storedRoles.includes('teacher') || selectedRoles.includes('teacher');

        return (
          <Card className="w-full max-w-lg dark:bg-zinc-800 relative z-10">
            <CardHeader className="space-y-1">
              {isAlsoTeacher && (
                <p className="text-xs text-center text-muted-foreground mb-1">
                  Step 2 of 2
                </p>
              )}
              <CardTitle className="text-2xl text-center dark:text-white">
                Parent & Children Information
              </CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                Enter your occupation and add your children
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleParentSubmit}>
              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="occupation" className="dark:text-white">
                    Your Occupation *
                  </Label>
                  <Input
                    id="occupation"
                    placeholder="e.g., Engineer"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    required
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <Label className="dark:text-white text-lg">Children (at least 1) *</Label>

                  {students.map((student, index) => (
                    <div
                      key={index}
                      className="mt-3 p-3 border rounded dark:border-zinc-600"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <Label className="dark:text-gray-400">Child {index + 1}</Label>
                        {students.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStudent(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="First Name *"
                          value={student.first_name}
                          onChange={(e) => updateStudent(index, 'first_name', e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Last Name *"
                          value={student.last_name}
                          onChange={(e) => updateStudent(index, 'last_name', e.target.value)}
                          required
                        />
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Enrollment Date *</Label>
                          <Input
                            type="date"
                            value={student.enrollment_date}
                            onChange={(e) =>
                              updateStudent(index, 'enrollment_date', e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                          <Input
                            type="date"
                            value={student.date_of_birth}
                            onChange={(e) =>
                              updateStudent(index, 'date_of_birth', e.target.value)
                            }
                          />
                        </div>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm col-span-2"
                          value={student.gender ? 'true' : 'false'}
                          onChange={(e) =>
                            updateStudent(index, 'gender', e.target.value === 'true')
                          }
                        >
                          <option value="true">Male</option>
                          <option value="false">Female</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-3"
                    onClick={addStudent}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Another Child
                  </Button>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      {/* ✅ Add animation styles */}
      <style>{`
        .lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          margin: auto;
          width: 90vw;
          z-index: 0;
          pointer-events: none;
        }
        .line {
          position: absolute;
          width: 1px;
          height: 100%;
          top: 0;
          left: 50%;
          background: rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .dark .line {
          background: rgba(255, 255, 255, 0.1);
        }
        .line::after {
          content: '';
          display: block;
          position: absolute;
          height: 15vh;
          width: 100%;
          top: -50%;
          left: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, #000000 75%, #000000 100%);
          animation: drop 7s 0s infinite;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.4, 0.26, 0, 0.97);
        }
        .dark .line::after {
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #ffffff 75%, #ffffff 100%);
        }
        .line:nth-child(1) {
          margin-left: -25%;
        }
        .line:nth-child(1)::after {
          animation-delay: 2s;
        }
        .line:nth-child(3) {
          margin-left: 25%;
        }
        .line:nth-child(3)::after {
          animation-delay: 2.5s;
        }
        @keyframes drop {
          0% { top: -50%; }
          100% { top: 110%; }
        }
      `}</style>
      <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 hover:opacity-80 transition-opacity">
      <img 
      src={logo} 
      alt="Book icon"
      className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
    />
      <span className="text-2xl font-extrabold tracking-tighter uppercase dark:text-white text-gray-900">
        Mouktassab
      </span>
    </Link>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* ✅ Main container with animation lines */}
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4 relative overflow-hidden">
        
        {/* ✅ Add the lines divs */}
        <div className="lines">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>

        {/* Render the step card */}
        {renderStep()}
      </div>
    </>
  );
}