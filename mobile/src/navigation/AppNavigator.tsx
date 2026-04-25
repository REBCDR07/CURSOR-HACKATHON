import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { colors } from '../components/UI';
import { LandingScreen } from '../screens/public/LandingScreen';
import { LoginScreen } from '../screens/public/LoginScreen';
import { SignupScreen } from '../screens/public/SignupScreen';
import { IntroFeaturesScreen, IntroForWhoScreen, IntroHowWorksScreen, IntroWhatIsScreen, IntroWelcomeScreen } from '../screens/intro/IntroScreens';
import { PatientDashboardScreen } from '../screens/patient/PatientDashboardScreen';
import { TreatmentsScreen } from '../screens/patient/TreatmentsScreen';
import { HistoryScreen } from '../screens/patient/HistoryScreen';
import { ProfileScreen } from '../screens/patient/ProfileScreen';
import { AddTreatmentScreen } from '../screens/patient/AddTreatmentScreen';
import { ActivityScreen } from '../screens/patient/ActivityScreen';
import { QRShareScreen } from '../screens/patient/QRShareScreen';
import { DoctorDashboardScreen } from '../screens/doctor/DoctorDashboardScreen';
import { PatientSearchScreen } from '../screens/doctor/PatientSearchScreen';
import { DoctorRequestsScreen } from '../screens/doctor/DoctorRequestsScreen';
import { DoctorProfileScreen } from '../screens/doctor/DoctorProfileScreen';
import { PatientRecordScreen } from '../screens/doctor/PatientRecordScreen';
import { NewPrescriptionScreen } from '../screens/doctor/NewPrescriptionScreen';
import { DoctorQueueScreen } from '../screens/doctor/DoctorQueueScreen';
import { DoctorScanQRScreen } from '../screens/doctor/DoctorScanQRScreen';
import { SharedRecordScreen } from '../screens/doctor/SharedRecordScreen';
import type {
  DoctorStackParamList,
  DoctorTabParamList,
  IntroStackParamList,
  PatientStackParamList,
  PatientTabParamList,
  PublicStackParamList,
} from './types';

const IntroStack = createNativeStackNavigator<IntroStackParamList>();
const PublicStack = createNativeStackNavigator<PublicStackParamList>();
const PatientStack = createNativeStackNavigator<PatientStackParamList>();
const DoctorStack = createNativeStackNavigator<DoctorStackParamList>();
const PatientTab = createBottomTabNavigator<PatientTabParamList>();
const DoctorTab = createBottomTabNavigator<DoctorTabParamList>();

function IntroNavigator({ onFinish }: { onFinish: () => void }) {
  return (
    <IntroStack.Navigator screenOptions={{ headerShown: false }}>
      <IntroStack.Screen name="IntroWelcome" component={IntroWelcomeScreen} />
      <IntroStack.Screen name="IntroWhatIs" component={IntroWhatIsScreen} />
      <IntroStack.Screen name="IntroForWho" component={IntroForWhoScreen} />
      <IntroStack.Screen name="IntroHowWorks" component={IntroHowWorksScreen} />
      <IntroStack.Screen name="IntroFeatures">
        {(props) => <IntroFeaturesScreen {...props} onFinish={onFinish} />}
      </IntroStack.Screen>
    </IntroStack.Navigator>
  );
}

function PublicNavigator() {
  return (
    <PublicStack.Navigator screenOptions={{ headerShown: false }}>
      <PublicStack.Screen name="Landing" component={LandingScreen} />
      <PublicStack.Screen name="Login" component={LoginScreen} />
      <PublicStack.Screen name="Signup" component={SignupScreen} />
    </PublicStack.Navigator>
  );
}

function PatientTabNavigator() {
  return (
    <PatientTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { minHeight: 62, paddingBottom: 6, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Dashboard'
              ? 'home-outline'
              : route.name === 'Treatments'
              ? 'medkit-outline'
              : route.name === 'History'
              ? 'time-outline'
              : 'person-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <PatientTab.Screen name="Dashboard" component={PatientDashboardScreen} options={{ tabBarLabel: 'Accueil' }} />
      <PatientTab.Screen name="Treatments" component={TreatmentsScreen} options={{ tabBarLabel: 'Traitements' }} />
      <PatientTab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Historique' }} />
      <PatientTab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </PatientTab.Navigator>
  );
}

function PatientNavigator() {
  return (
    <PatientStack.Navigator>
      <PatientStack.Screen name="PatientTabs" component={PatientTabNavigator} options={{ headerShown: false }} />
      <PatientStack.Screen name="AddTreatment" component={AddTreatmentScreen} options={{ title: 'Ajouter un traitement' }} />
      <PatientStack.Screen name="Activity" component={ActivityScreen} options={{ title: 'Journal activite' }} />
      <PatientStack.Screen name="QRShare" component={QRShareScreen} options={{ title: 'Partage QR' }} />
    </PatientStack.Navigator>
  );
}

function DoctorTabNavigator() {
  return (
    <DoctorTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { minHeight: 62, paddingBottom: 6, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'DoctorHome'
              ? 'pulse-outline'
              : route.name === 'PatientSearch'
              ? 'search-outline'
              : route.name === 'DoctorRequests'
              ? 'document-text-outline'
              : 'person-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <DoctorTab.Screen name="DoctorHome" component={DoctorDashboardScreen} options={{ tabBarLabel: 'Accueil' }} />
      <DoctorTab.Screen name="PatientSearch" component={PatientSearchScreen} options={{ tabBarLabel: 'Patients' }} />
      <DoctorTab.Screen name="DoctorRequests" component={DoctorRequestsScreen} options={{ tabBarLabel: 'Demandes' }} />
      <DoctorTab.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </DoctorTab.Navigator>
  );
}

function DoctorNavigator() {
  return (
    <DoctorStack.Navigator>
      <DoctorStack.Screen name="DoctorTabs" component={DoctorTabNavigator} options={{ headerShown: false }} />
      <DoctorStack.Screen name="PatientRecord" component={PatientRecordScreen} options={{ title: 'Dossier patient' }} />
      <DoctorStack.Screen name="NewPrescription" component={NewPrescriptionScreen} options={{ title: 'Nouvelle ordonnance' }} />
      <DoctorStack.Screen name="DoctorQueue" component={DoctorQueueScreen} options={{ title: "File d'attente" }} />
      <DoctorStack.Screen name="DoctorScanQR" component={DoctorScanQRScreen} options={{ title: 'Scanner QR' }} />
      <DoctorStack.Screen name="SharedRecord" component={SharedRecordScreen} options={{ title: 'Dossier partage' }} />
    </DoctorStack.Navigator>
  );
}

export function AppNavigator() {
  const { loading, session } = useAuth();
  const [showStartupLoader, setShowStartupLoader] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartupLoader(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showStartupLoader) {
    return <LoadingScreen label="Initialisation de Health Pocket..." />;
  }

  if (showIntro) {
    return (
      <NavigationContainer>
        <IntroNavigator onFinish={() => setShowIntro(false)} />
      </NavigationContainer>
    );
  }

  if (loading) {
    return <LoadingScreen label="Chargement de votre espace..." />;
  }

  return (
    <NavigationContainer>
      {!session ? <PublicNavigator /> : session.role === 'patient' ? <PatientNavigator /> : <DoctorNavigator />}
    </NavigationContainer>
  );
}
