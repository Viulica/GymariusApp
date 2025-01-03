import * as React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import NewWorkoutScreen from './screens/NewWorkoutScreen';
import HistoryScreen from './screens/HistoryScreen';
import StatsContainer from './screens/StatsContainer'; 
import NotesScreen from './screens/NotesScreen';
import NoteDetail from './screens/NoteDetail';
import ChatScreen from './screens/ChatScreen';
import { ChatProvider } from './contexts/ChatContext';
import { ExerciseProvider } from './contexts/ExerciseContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';

const originalError = console.error;
console.error = (...args) => {
    if (args[0]?.includes?.('Text strings must be rendered within a <Text> component')) {
        return;
    }
    originalError.apply(console, args);
};

const Tab = createBottomTabNavigator();
const WorkoutStack = createStackNavigator();
const Stack = createStackNavigator();

function WorkoutStackNavigator() {
    return (
        <WorkoutStack.Navigator>
            <WorkoutStack.Screen 
                name="New Workout" 
                component={NewWorkoutScreen}
                options={{ headerShown: false }}
            />
            <WorkoutStack.Screen 
                name="Chat" 
                component={ChatScreen}
                options={{
                    headerShown: false,
                }}
            />
        </WorkoutStack.Navigator>
    );
}

function NotesStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true 
            }}
        >
            <Stack.Screen
                name="NotesList"  
                component={NotesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="NoteDetail"
                component={NoteDetail}
                options={({ route }) => ({
                    title: route.params?.note?.title || 'New Note',
                    headerBackTitle: "Back"
                })}
            />
        </Stack.Navigator>
    );
}

function MyTabs() {
    const { theme } = useTheme();
    
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'History') {
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'Workout') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Statistics') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Notes') {
                        iconName = focused ? 'book' : 'book-outline'; 
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                headerShown: false,
                tabBarLabel: ({ focused, color }) => (
                    <Text style={{ color }}>
                        {route.name}
                    </Text>
                ),
            })}
        >
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Workout" component={WorkoutStackNavigator} />
            <Tab.Screen name="Statistics" component={StatsContainer} /> 
            <Tab.Screen name="Notes" component={NotesStack} />
        </Tab.Navigator>
    );
}

export default function App() {
    const [fontsLoaded] = useFonts({
        'Pacifico': require('./assets/fonts/Pacifico-Regular.ttf'),
    });

    if (!fontsLoaded) {
        return <AppLoading />;
    }

    return (
        <ThemeProvider>
            <ChatProvider>
                <ExerciseProvider> 
                    <NavigationContainer>
                        <MyTabs />
                    </NavigationContainer>
                </ExerciseProvider>
            </ChatProvider>
        </ThemeProvider>
    );
}
