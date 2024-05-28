import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import WorkoutService from '../services/WorkoutService';
import StatisticsScreen from './StatisticsScreen';
import ExerciseStatisticsScreen from './ExerciseStatisticsScreen'; 
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const StatsContainer = ({ navigation }) => {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchWorkouts();
        });

        fetchWorkouts(); 
        return unsubscribe;
    }, [navigation]);

    const fetchWorkouts = async () => {
        const allWorkouts = await WorkoutService.getWorkouts();
        setWorkouts(allWorkouts);
        setLoading(false)
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }
    if (workouts.length === 0) {
        return (
            <View style={styles.container}>
                <Text>No workouts to display</Text>
            </View>
        );
    }

    return (
        <Stack.Navigator>
            <Stack.Screen name="StatisticsMain" options={{ headerShown: false }}>
                {props => <StatisticsScreen {...props} workouts={workouts} />}
            </Stack.Screen>
            <Stack.Screen name="ExerciseStatistics" component={ExerciseStatisticsScreen} options={{ title: 'Exercise Statistics' }} />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default StatsContainer;
