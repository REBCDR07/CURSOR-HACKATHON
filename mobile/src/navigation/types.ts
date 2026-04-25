export type IntroStackParamList = {
  IntroWelcome: undefined;
  IntroWhatIs: undefined;
  IntroForWho: undefined;
  IntroHowWorks: undefined;
  IntroFeatures: undefined;
};

export type PublicStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
};

export type PatientTabParamList = {
  Dashboard: undefined;
  Treatments: undefined;
  History: undefined;
  Profile: undefined;
};

export type PatientStackParamList = {
  PatientTabs: undefined;
  AddTreatment: undefined;
  Activity: undefined;
  QRShare: undefined;
};

export type DoctorTabParamList = {
  DoctorHome: undefined;
  PatientSearch: undefined;
  DoctorRequests: undefined;
  DoctorProfile: undefined;
};

export type DoctorStackParamList = {
  DoctorTabs: undefined;
  PatientRecord: { patientId: string };
  NewPrescription: { patientId: string };
  DoctorQueue: undefined;
  DoctorScanQR: undefined;
  SharedRecord: { token: string };
};
