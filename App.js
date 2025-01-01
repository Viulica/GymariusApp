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
                options={{
                    headerTitle: props => <Text {...props}>New Workout</Text>
                }}
            />
            <WorkoutStack.Screen 
                name="Chat" 
                component={ChatScreen} 
                options={{
                    headerTitle: props => <Text {...props}>Workout Coach Chat</Text>
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
                options={{
                    headerTitle: props => <Text {...props}>Notes</Text>
                }}
            />
            <Stack.Screen
                name="NoteDetail"
                component={NoteDetail}
                options={({ route }) => ({
                    headerTitle: props => (
                        <Text {...props}>
                            {route.params?.note?.title || 'New Note'}
                        </Text>
                    ),
                    headerBackTitle: props => <Text {...props}>Back</Text>
                })}
            />
        </Stack.Navigator>
    );
}

function MyTabs() {
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
                tabBarActiveTintColor: 'tomato',
                tabBarInactiveTintColor: 'gray',
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
    return (
        <ChatProvider>
            <ExerciseProvider> 
                <NavigationContainer>
                    <MyTabs />
                </NavigationContainer>
            </ExerciseProvider>
        </ChatProvider>
    );
}
