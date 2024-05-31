import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, Dimensions, Button, StyleSheet, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import moment from 'moment'; 
import ExercisePicker from '../components/ExercisePicker';
import { ExerciseContext } from './ExerciseContext';

const StatisticsScreen = ({ navigation, workouts = [] }) => {
  const { predefinedExercises } = useContext(ExerciseContext);
  const [mode, setMode] = useState('week');
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [currentPeriodCount, setCurrentPeriodCount] = useState(0);
  const scrollViewRef = useRef(0);
  const [maxWorkoutCount, setMaxWorkoutCount] = useState(workouts.length);  
  const [selectedExercise, setSelectedExercise] = useState(null);

  const screenWidth = Dimensions.get('window').width;

  const getChartWidth = (mode) => {
    switch (mode) {
      case 'week':
        return screenWidth * 5.2; 
      case 'month':
        return screenWidth * 2;
      case 'year':
        return screenWidth;
      default:
        return screenWidth;
    }
  };
  const chartWidth = getChartWidth(mode);


  const chartConfig = {
    backgroundColor: '#e26a00',
    backgroundGradientFrom: '#fb8c00',
    backgroundGradientTo: '#ffa726',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726'
    },
    useShadowColorFromDataset: false 
  };

  useEffect(() => {
    const current = moment();
    const currentCount = workouts.filter(workout => {
      const workoutMoment = moment(workout.date);
      switch (mode) {
        case 'week':
          return current.isoWeek() === workoutMoment.isoWeek() && current.year() === workoutMoment.year();
        case 'month':
          return current.month() === workoutMoment.month() && current.year() === workoutMoment.year();
        case 'year':
          return current.year() === workoutMoment.year();
        default:
          return false;
      }
    }).length;
    setCurrentPeriodCount(currentCount);
  }, [mode, workouts]);

  const getMaxWorkouts = (values) => {
    const max = Math.max(...values);
    return max > 0 ? max : 1; 
  };
  
  useEffect(() => {
    const { labels, datasets, maxWorkouts } = countWorkouts(workouts, mode);
    setChartData({ labels, datasets });
    setMaxWorkoutCount(getMaxWorkouts(datasets[0].data)); 
  }, [mode, workouts]);

  useEffect(() => {
    if (mode === 'week') {
      const timer = setTimeout(() => {
        const currentWeek = moment().week();
        const weekWidth = getChartWidth('week') / 52;
        const initialScrollPosition = (currentWeek - 5) * weekWidth;
        scrollViewRef.current?.scrollTo({ x: initialScrollPosition, animated: true });
      }, 300); 
      return () => clearTimeout(timer);
    }
    else if (mode === "month") {
      const timer = setTimeout(() => {
        const currentMonth = moment().month();
        const monthWidth = getChartWidth('month') / 12;
        const initialScrollPosition = (currentMonth - 2) * monthWidth;
        scrollViewRef.current?.scrollTo({ x: initialScrollPosition, animated: true });
      }, 300); 
      return () => clearTimeout(timer);

    }
  }, [chartData, mode]); 

  const countWorkouts = (workouts, mode) => {
    const counts = {};
    let minYear = new Date().getFullYear();
    let maxYear = new Date().getFullYear();
  
    if (mode === 'year' && workouts.length > 0) {
      minYear = moment(workouts.reduce((min, p) => p.date < min ? p.date : min, workouts[0].date)).year();
      maxYear = moment(workouts.reduce((max, p) => p.date > max ? p.date : max, workouts[0].date)).year();
    }
  
    if (mode === 'year') {
      for (let i = minYear; i <= maxYear; i++) {
        counts[i] = 0; 
      }
    } else {
      const maxCounts = mode === 'week' ? 52 : 12;
      for (let i = 1; i <= maxCounts; i++) {
        counts[i] = 0;
      }
    }
  
    workouts.forEach(workout => {
      const date = moment(workout.date);
      let key;
      switch (mode) {
        case 'week':
          key = date.week();
          break;
        case 'month':
          key = date.month() + 1; 
          break;
        case 'year':
          key = date.year();
          break;
      }
      if (key in counts) {
        counts[key]++;
      }
    });
  
    const labels = Object.keys(counts).sort((a, b) => parseInt(a) - parseInt(b));
    const values = labels.map(label => counts[label]);
  
    return {
      labels,
      datasets: [{
        data: values
      }],
      maxWorkoutCount
    };
  };

  const navigateToExerciseStatistics = () => {
    if (selectedExercise) {
      navigation.navigate('ExerciseStatistics', { exerciseId: selectedExercise });
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Week" onPress={() => setMode('week')} color="#84a9ac" />
        <Button title="Month" onPress={() => setMode('month')} color="#3b6978" />
        <Button title="Year" onPress={() => setMode('year')} color="#204051" />
      </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{ flex: 1 }}
        >
          <BarChart
            data={chartData}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            fromZero={true}
            segments={maxWorkoutCount === 1 ? 2 : maxWorkoutCount}
            yAxisInterval={1}
          />
        </ScrollView>
        <Text style={styles.infoText}>
            This {mode}: {currentPeriodCount}
        </Text>
        <View style={styles.pickerContainer}>
            <ExercisePicker
                exercises={predefinedExercises}
                selectedValue={selectedExercise}
                onChange={(item) => setSelectedExercise(item)}
            />
        </View>
        <View style={styles.buttonContainer}>
            <Button title="Show Statistics" onPress={navigateToExerciseStatistics} />
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 10
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 50,
        marginBottom: 20,
    },
    pickerContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    infoText: {
        fontSize: 21,
        textAlign: 'center',
        marginBottom: 20, 
    },
});

export default StatisticsScreen;
