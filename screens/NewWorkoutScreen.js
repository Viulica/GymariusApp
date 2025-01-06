import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, TextInput, ScrollView, TouchableWithoutFeedback, Keyboard, Vibration } from 'react-native';
import ExercisePicker from '../components/ExercisePicker';
import WorkoutService from '../services/WorkoutService';
import ExerciseCard from '../components/ExerciseCard';
import { useChat } from '../contexts/ChatContext';
import Exercise from '../models/Exercise';
import Set from '../models/Set';
import { ExerciseContext } from '../contexts/ExerciseContext';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../contexts/ThemeContext';

const EXERCISE_TYPES = [
    { label: 'Compound', value: 'Compound' },
    { label: 'Isolation', value: 'Isolation' },
];

const BODY_PARTS = [
    { label: 'Chest', value: 'Chest' },
    { label: 'Back', value: 'Back' },
    { label: 'Legs', value: 'Legs' },
    { label: 'Arms', value: 'Arms' },
    { label: 'Shoulders', value: 'Shoulders' },
];

const NewWorkoutScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { predefinedExercises, setPredefinedExercises } = useContext(ExerciseContext);
    const [workoutExercises, setWorkoutExercises] = useState([]);
    const [isCustomExerciseModalVisible, setIsCustomExerciseModalVisible] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { chatHistory, setChatHistory } = useChat();
    const [workoutName, setWorkoutName] = useState('');
    const [customExercise, setCustomExercise] = useState({
        name: '',
        type: '',
        bodyPart: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredExercises, setFilteredExercises] = useState(predefinedExercises);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const timerRef = useRef(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [openType, setOpenType] = useState(false);
    const [openBodyPart, setOpenBodyPart] = useState(false);
    const [exerciseTypes] = useState(EXERCISE_TYPES);
    const [bodyParts] = useState(BODY_PARTS);
    const [justSaved, setJustSaved] = useState(false);
    const [isTimerModalVisible, setIsTimerModalVisible] = useState(false);
    const [timerMode, setTimerMode] = useState('stopwatch');
    const [countdownMinutes, setCountdownMinutes] = useState(0);
    const [countdownSecs, setCountdownSecs] = useState(0);
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
    const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
    const stopwatchRef = useRef(null);
    const [stopwatchMs, setStopwatchMs] = useState(0);
    const [countdownIsRunning, setCountdownIsRunning] = useState(false);
    const countdownRef = useRef(null);
    const typeDropdownHeight = useRef(0);
    const [workoutTimer, setWorkoutTimer] = useState(0);
    const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState(false);
    const workoutTimerRef = useRef(null);

    const categoryIcons = {
        'All': 'fitness',
        'Recent': 'time',
        'Chest': 'body',
        'Back': 'body',
        'Legs': 'body',
        'Arms': 'body',
        'Shoulders': 'body'
    };

    useEffect(() => {
        navigation.setOptions({
            clearChatHistory,
        });
    }, [navigation, clearChatHistory]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (stopwatchRef.current) {
                clearInterval(stopwatchRef.current);
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
            if (workoutTimerRef.current) {
                clearInterval(workoutTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (route.params?.templateWorkout) {
            const template = route.params.templateWorkout;
            setWorkoutName(template.name + ' (Copy)');
            const copiedExercises = template.exercises.map(exercise => ({
                ...exercise,
                id: Date.now().toString() + Math.random().toString(),
                sets: exercise.sets.map(set => ({
                    ...set,
                    id: Date.now().toString() + Math.random().toString()
                }))
            }));
            setWorkoutExercises(copiedExercises);
        }
    }, [route.params?.templateWorkout]);

    useEffect(() => {
        const initializeExercises = async () => {
            try {
                let exercises = await WorkoutService.getExercises();
                
                if (!exercises || exercises.length === 0) {
                    exercises = [
                        { id: '1', name: 'Bench Press', type: 'Compound', bodyPart: 'Chest' },
                        { id: '2', name: 'Squat', type: 'Compound', bodyPart: 'Legs' },
                        { id: '3', name: 'Deadlift', type: 'Compound', bodyPart: 'Back' },
                        { id: '4', name: 'Pull-up', type: 'Compound', bodyPart: 'Back' },
                        { id: '5', name: 'Push-up', type: 'Compound', bodyPart: 'Chest' },
                        { id: '6', name: 'Shoulder Press', type: 'Compound', bodyPart: 'Shoulders' },
                        { id: '7', name: 'Bicep Curl', type: 'Isolation', bodyPart: 'Arms' },
                        { id: '8', name: 'Tricep Extension', type: 'Isolation', bodyPart: 'Arms' },
                        { id: '9', name: 'Leg Press', type: 'Compound', bodyPart: 'Legs' },
                        { id: '10', name: 'Lat Pulldown', type: 'Compound', bodyPart: 'Back' },
                    ];
                    
                    for (const exercise of exercises) {
                        await WorkoutService.addExercise(exercise);
                    }
                }
                
                setPredefinedExercises(exercises);
                setFilteredExercises(exercises);
            } catch (error) {
                console.error('Error initializing exercises:', error);
            }
        };

        initializeExercises();
    }, []);

    const navigateToChatScreen = () => {
        navigation.navigate('Chat', { workoutExercises });
    };

    const addSetToExercise = (exerciseId, weight, reps) => {
        setWorkoutExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                const newSet = new Set(weight, reps);
                ex.addSet(newSet);
            }
            return ex;
        }));
    };

    const deleteSetFromExercise = (exerciseId, setIndex) => {
        setWorkoutExercises(prev => prev.filter(ex => {
            if (ex.id === exerciseId) {
                ex.sets.splice(setIndex, 1);
                if (ex.sets.length === 0) {
                    return false;
                }
            }
            return true;
        }));
    };

    const deleteExercise = (exerciseId) => {
        setWorkoutExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    };

    const clearChatHistory = () => {
        setChatHistory([]);
    };

    const handleFinishWorkout = () => {
        if (workoutExercises.length === 0) {
            Alert.alert(
                "Empty Workout", 
                "No exercises to save. Please add some exercises before finishing.",
                [{ text: "OK" }]
            );
            return;
        }

        Alert.prompt(
            "Name Your Workout",
            "Enter a name for this workout:",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Save",
                    onPress: async (name) => {
                        const workoutName = name || 'Unnamed Workout';
                        const duration = workoutTimer;
                        stopWorkoutTimer();
                        setWorkoutTimer(0);
                        clearChatHistory();

                        const workout = {
                            name: workoutName,
                            id: `workout-${new Date().getTime()}`,
                            date: new Date().toISOString(),
                            exercises: workoutExercises,
                            duration: duration,
                            linkedNotes: []
                        };

                        try {
                            await WorkoutService.addWorkout(workout);
                            Alert.alert(
                                "Success", 
                                "Workout saved successfully!",
                                [{ text: "OK" }]
                            );
                            setJustSaved(true);
                            setWorkoutTimer(0);
                            setIsWorkoutTimerRunning(false);
                            if (workoutTimerRef.current) {
                                clearInterval(workoutTimerRef.current);
                            }
                            navigation.navigate('History');
                        } catch (error) {
                            Alert.alert(
                                "Error", 
                                "Failed to save the workout. Please try again.",
                                [{ text: "OK" }]
                            );
                            console.error("Failed to save workout:", error);
                        }
                    }
                }
            ],
            'plain-text',
            '',
            'default'
        );
    };

    const clearWorkout = () => {
        stopTimer();
        setTimerSeconds(0);
        clearChatHistory();
        setWorkoutExercises([]);
        setWorkoutName('');
    };

    const handleAddCustomExercise = () => {
        setIsModalVisible(false);
        setIsCustomExerciseModalVisible(true);
    };

    const saveCustomExercise = async () => {
        if (customExercise.name && customExercise.type && customExercise.bodyPart) {
            const newExercise = {
                id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: customExercise.name,
                type: customExercise.type,
                bodyPart: customExercise.bodyPart,
                sets: []
            };
            await WorkoutService.addExercise(newExercise);
            const updatedExercises = await WorkoutService.getExercises();
            setPredefinedExercises(updatedExercises);
            setCustomExercise({ name: '', type: '', bodyPart: '' });
            setIsCustomExerciseModalVisible(false);
            setIsModalVisible(true);
        } else {
            Alert.alert("Error", "Please fill in all fields.");
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        let filtered = predefinedExercises;
        
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(exercise => exercise.bodyPart === selectedCategory);
        }
        
        if (query) {
            filtered = filtered.filter(exercise => 
                exercise.name.toLowerCase().includes(query.toLowerCase()) ||
                exercise.type.toLowerCase().includes(query.toLowerCase()) ||
                exercise.bodyPart.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        setFilteredExercises(filtered);
    };

    const startTimer = () => {
        if (!isTimerRunning) {
            setIsTimerRunning(true);
            timerRef.current = setInterval(() => {
                if (timerMode === 'stopwatch') {
                    setTimerSeconds(prev => prev + 1);
                } else {
                    setCountdownSeconds(prev => {
                        if (prev <= 1) {
                            stopTimer();
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
    };

    const stopTimer = () => {
        if (isTimerRunning) {
            setIsTimerRunning(false);
            clearInterval(timerRef.current);
        }
    };

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const filterByCategory = (category) => {
        setSelectedCategory(category);
        let filtered = predefinedExercises;
        
        if (category !== 'All') {
            if (category === 'Recent') {
                filtered = predefinedExercises.slice(0, 5);
            } else {
                filtered = predefinedExercises.filter(exercise => exercise.bodyPart === category);
            }
        }
        
        if (searchQuery) {
            filtered = filtered.filter(exercise => 
                exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredExercises(filtered);
    };

    useEffect(() => {
        const loadExercises = async () => {
            const exercises = await WorkoutService.getExercises();
            setFilteredExercises(exercises);
        };
        loadExercises();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (justSaved) {
                setWorkoutExercises([]);
                setWorkoutName('');
                setTimerSeconds(0);
                setIsTimerRunning(false);
                clearChatHistory();
                setJustSaved(false);
            }
        });

        return unsubscribe;
    }, [navigation, justSaved]);

    const openTimerModal = () => {
        setIsTimerModalVisible(true);
    };

    const startStopwatch = () => {
        if (!isStopwatchRunning) {
            setIsStopwatchRunning(true);
            stopwatchRef.current = setInterval(() => {
                setStopwatchMs(prev => {
                    if (prev === 99) {
                        setStopwatchSeconds(s => s + 1);
                        return 0;
                    }
                    return prev + 1;
                });
            }, 10);
        }
    };

    const stopStopwatch = () => {
        if (isStopwatchRunning) {
            setIsStopwatchRunning(false);
            clearInterval(stopwatchRef.current);
        }
    };

    const resetStopwatch = () => {
        stopStopwatch();
        setStopwatchSeconds(0);
        setStopwatchMs(0);
    };

    const formatCountdownTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startCountdown = () => {
        const totalSeconds = countdownMinutes * 60 + countdownSecs;
        setCountdownSeconds(totalSeconds);
        setCountdownIsRunning(true);
        
        countdownRef.current = setInterval(() => {
            setCountdownSeconds(prev => {
                if (prev <= 1) {
                    stopCountdown();
                    Vibration.vibrate([0, 500, 100, 500]);
                    Alert.alert(
                        "Time's Up! 🎯",
                        "Your countdown has finished!",
                        [
                            { 
                                text: "OK",
                                onPress: () => {
                                    Vibration.cancel();
                                }
                            }
                        ]
                    );
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopCountdown = () => {
        setCountdownIsRunning(false);
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    };

    const resetCountdown = () => {
        stopCountdown();
        const totalSeconds = countdownMinutes * 60 + countdownSecs;
        setCountdownSeconds(totalSeconds);
    };

    const formatStopwatchTime = (seconds, ms) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const resetAllTimers = () => {
        stopStopwatch();
        stopCountdown();
        
        setStopwatchSeconds(0);
        setStopwatchMs(0);
        setCountdownMinutes(0);
        setCountdownSecs(0);
        setCountdownSeconds(0);
        setTimerMode('stopwatch');
    };

    const handleCopyWorkout = (workout) => {
        navigation.navigate('Workout', {
            screen: 'New Workout',
            params: {
                templateWorkout: workout
            }
        });
    };

    const renderFABs = () => (
        <View style={styles.fabContainer}>
            <TouchableOpacity
                style={[
                    styles.fab,
                    {
                        backgroundColor: theme.accent,
                        borderRadius: 28,
                        borderBottomRightRadius: 0,
                    }
                ]}
                onPress={openTimerModal}
            >
                <Icon
                    name="timer-outline"
                    size={24}
                    color="#fff"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.fab,
                    {
                        backgroundColor: theme.secondary,
                        borderRadius: 28,
                        borderTopLeftRadius: 0,
                    }
                ]}
                onPress={() => setIsModalVisible(true)}
            >
                <Icon
                    name="add"
                    size={24}
                    color="#fff"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.fab,
                    {
                        backgroundColor: theme.accent,
                        borderRadius: 15,
                        transform: [{ rotate: '45deg' }],
                    }
                ]}
                onPress={navigateToChatScreen}
            >
                <Icon
                    name="chatbubble"
                    size={24}
                    color="#fff"
                    style={{ transform: [{ rotate: '-45deg' }] }}
                />
            </TouchableOpacity>
        </View>
    );

    const dynamicStyles = {
        customExerciseContainer: {
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.1)',
            backgroundColor: theme.surface,
        }
    };

    const handleCloseExerciseModal = () => {
        setIsModalVisible(false);
        setSearchQuery('');
        setSelectedCategory('All');
        setFilteredExercises(predefinedExercises);
    };

    const startWorkoutTimer = () => {
        if (!isWorkoutTimerRunning) {
            setIsWorkoutTimerRunning(true);
            workoutTimerRef.current = setInterval(() => {
                setWorkoutTimer(prev => prev + 1);
            }, 1000);
        }
    };

    const stopWorkoutTimer = () => {
        if (isWorkoutTimerRunning) {
            setIsWorkoutTimerRunning(false);
            clearInterval(workoutTimerRef.current);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.surface }]}>
                    <View style={styles.headerActions}>
                        <View style={styles.timerContent}>
                            <Icon 
                                name="time" 
                                size={20} 
                                color={isWorkoutTimerRunning ? theme.primary : theme.textSecondary}
                            />
                            <Text style={[
                                styles.timerText,
                                { color: isWorkoutTimerRunning ? theme.primary : theme.textSecondary }
                            ]}>
                                {formatTime(workoutTimer)}
                            </Text>
                        </View>
                        {workoutTimer > 0 ? (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.startWorkoutButton, 
                                        { 
                                            backgroundColor: theme.secondary,
                                            paddingHorizontal: 12
                                        }
                                    ]}
                                    onPress={isWorkoutTimerRunning ? stopWorkoutTimer : startWorkoutTimer}
                                >
                                    <Icon 
                                        name={isWorkoutTimerRunning ? "pause-circle" : "play-circle"} 
                                        size={24} 
                                        color="#fff" 
                                    />
                                    <Text style={styles.startWorkoutButtonText}>
                                        {isWorkoutTimerRunning ? 'Pause' : 'Resume'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.startWorkoutButton, 
                                        { backgroundColor: theme.success }
                                    ]}
                                    onPress={handleFinishWorkout}
                                >
                                    <Icon name="checkmark" size={18} color="#fff" />
                                    <Text style={styles.startWorkoutButtonText}>
                                        Finish
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.startWorkoutButton, 
                                    { backgroundColor: theme.primary }
                                ]}
                                onPress={startWorkoutTimer}
                            >
                                <Icon name="play" size={18} color="#fff" />
                                <Text style={styles.startWorkoutButtonText}>
                                    Start Workout
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <FlatList
                    data={workoutExercises || []}
                    renderItem={({ item: exercise }) => (
                        <ExerciseCard
                            exercise={exercise}
                            onAddSet={addSetToExercise}
                            onDeleteSet={deleteSetFromExercise}
                            onDelete={() => deleteExercise(exercise.id)}
                        />
                    )}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.exerciseList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No exercises added yet</Text>
                            <Text style={styles.emptyStateSubtext}>Tap the + button to add exercises</Text>
                        </View>
                    )}
                />

                {renderFABs()}

                <Modal
                    visible={isModalVisible}
                    animationType="slide"
                    transparent={false}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                        <View style={[styles.modalHeader, { backgroundColor: theme.surface }]}>
                            <Text style={[
                                styles.modalTitle, 
                                { 
                                    color: theme.text,
                                    fontFamily: theme.titleFont,
                                    fontSize: 24,
                                    marginTop: 40,
                                    marginBottom: 16,
                                    marginHorizontal: 16,
                                }
                            ]}>
                                Add Exercise
                            </Text>
                            <TouchableOpacity 
                                onPress={handleCloseExerciseModal}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[
                                styles.searchInput, 
                                { 
                                    backgroundColor: theme.surface,
                                    color: theme.text,
                                    borderColor: theme.border
                                }
                            ]}
                            placeholder="Search exercises..."
                            placeholderTextColor={theme.textSecondary}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />

                        <View style={[styles.categoriesContainer, { backgroundColor: theme.surface }]}>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                style={styles.categoryScroll}
                            >
                                {['All', 'Recent', ...BODY_PARTS.map(bp => bp.value)].map((category) => (
                                    <TouchableOpacity
                                        key={category}
                                        style={[
                                            styles.categoryPill,
                                            selectedCategory === category && { backgroundColor: theme.primary },
                                            { backgroundColor: selectedCategory === category ? theme.primary : theme.cardBackground }
                                        ]}
                                        onPress={() => filterByCategory(category)}
                                    >
                                        <View style={styles.categoryContent}>
                                            <Icon 
                                                name={categoryIcons[category]} 
                                                size={20} 
                                                color={selectedCategory === category ? '#fff' : theme.text} 
                                            />
                                            <Text style={[
                                                styles.categoryPillText,
                                                selectedCategory === category && { color: '#fff' },
                                                { color: selectedCategory === category ? '#fff' : theme.text }
                                            ]}>
                                                {category}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.exerciseListContainer}>
                            <FlatList
                                data={filteredExercises}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.exerciseItem,
                                            { backgroundColor: theme.surface }
                                        ]}
                                        onPress={() => {
                                            const newExercise = new Exercise(
                                                item.id,
                                                item.name,
                                                item.type,
                                                item.bodyPart
                                            );
                                            setWorkoutExercises(prev => [...prev, newExercise]);
                                            handleCloseExerciseModal();
                                        }}
                                    >
                                        <View style={styles.exerciseItemContent}>
                                            <View>
                                                <Text style={[styles.exerciseName, { color: theme.text }]}>
                                                    {item.name}
                                                </Text>
                                                <Text style={[styles.exerciseDetail, { color: theme.textSecondary }]}>
                                                    {item.type} • {item.bodyPart}
                                                </Text>
                                            </View>
                                            <Icon name="add-circle-outline" size={24} color={theme.primary} />
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => (
                                    <View style={[styles.separator, { backgroundColor: theme.border }]} />
                                )}
                                keyExtractor={item => item.id}
                            />
                        </View>

                        <View style={dynamicStyles.customExerciseContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.customExerciseButton, 
                                    { 
                                        backgroundColor: theme.primary,
                                        marginHorizontal: 16,
                                        marginBottom: 24
                                    }
                                ]}
                                onPress={() => {
                                    setIsModalVisible(false);
                                    setIsCustomExerciseModalVisible(true);
                                }}
                            >
                                <Text style={[
                                    styles.customExerciseButtonText,
                                    {
                                        fontSize: 15
                                    }
                                ]}>
                                    Create Custom Exercise
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isCustomExerciseModalVisible}
                    animationType="slide"
                    transparent={true}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                        <View style={[styles.modalHeader, { backgroundColor: theme.surface }]}>
                            <Text style={[
                                styles.modalTitle,
                                {
                                    color: theme.text,
                                    fontFamily: theme.titleFont,
                                    marginTop: 40,
                                    marginBottom: 16,
                                    marginHorizontal: 16,
                                    fontSize: 24
                                }
                            ]}>
                                Create Custom Exercise
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setIsCustomExerciseModalVisible(false)}
                                style={[styles.closeButton, { marginTop: 40 }]}
                            >
                                <Icon name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.customExerciseForm}>
                            <View style={styles.formContainer}>
                                <Text style={[styles.inputLabel, { color: theme.text }]}>Exercise Name</Text>
                                <TextInput
                                    style={[
                                        styles.customInput,
                                        { 
                                            backgroundColor: theme.surface,
                                            color: theme.text,
                                            borderColor: theme.border
                                        }
                                    ]}
                                    value={customExercise.name}
                                    onChangeText={(text) => setCustomExercise(prev => ({ ...prev, name: text }))}
                                    placeholder="Enter exercise name"
                                    placeholderTextColor={theme.textSecondary}
                                />

                                <View style={styles.dropdownSection}>
                                    <Text style={[styles.inputLabel, { color: theme.text }]}>Exercise Type</Text>
                                    <DropDownPicker
                                        open={openType}
                                        value={customExercise.type}
                                        items={exerciseTypes}
                                        setOpen={setOpenType}
                                        setValue={(callback) => {
                                            const value = callback(customExercise.type);
                                            setCustomExercise(prev => ({ ...prev, type: value }));
                                        }}
                                        style={[styles.dropdown, { backgroundColor: theme.surface }]}
                                        textStyle={{ color: theme.text }}
                                        dropDownContainerStyle={[
                                            styles.dropdownContainer, 
                                            { 
                                                backgroundColor: theme.surface,
                                                position: 'absolute',
                                                top: 50,
                                                zIndex: 2000
                                            }
                                        ]}
                                        placeholderStyle={{ color: theme.textSecondary }}
                                        placeholder="Select exercise type"
                                        zIndex={2000}
                                        onOpen={() => setOpenBodyPart(false)}
                                        listMode="SCROLLVIEW"
                                        onLayout={({nativeEvent}) => {
                                            typeDropdownHeight.current = nativeEvent.layout.height;
                                        }}
                                    />
                                </View>

                                <View style={[
                                    styles.dropdownSection, 
                                    { 
                                        marginTop: 16,
                                        transform: [{ 
                                            translateY: openType ? typeDropdownHeight.current : 0 
                                        }]
                                    }
                                ]}>
                                    <Text style={[styles.inputLabel, { color: theme.text }]}>Body Part</Text>
                                    <DropDownPicker
                                        open={openBodyPart}
                                        value={customExercise.bodyPart}
                                        items={bodyParts}
                                        setOpen={setOpenBodyPart}
                                        setValue={(callback) => {
                                            const value = callback(customExercise.bodyPart);
                                            setCustomExercise(prev => ({ ...prev, bodyPart: value }));
                                        }}
                                        style={[styles.dropdown, { backgroundColor: theme.surface }]}
                                        textStyle={{ color: theme.text }}
                                        dropDownContainerStyle={[
                                            styles.dropdownContainer, 
                                            { 
                                                backgroundColor: theme.surface,
                                                position: 'absolute',
                                                top: 50,
                                                zIndex: 1000
                                            }
                                        ]}
                                        placeholderStyle={{ color: theme.textSecondary }}
                                        placeholder="Select body part"
                                        zIndex={1000}
                                        onOpen={() => setOpenType(false)}
                                        listMode="SCROLLVIEW"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.customExerciseActions}>
                            <TouchableOpacity
                                style={[
                                    styles.saveExerciseButton,
                                    { backgroundColor: theme.primary }
                                ]}
                                onPress={async () => {
                                    if (customExercise.name && customExercise.type && customExercise.bodyPart) {
                                        const newExercise = {
                                            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                            name: customExercise.name,
                                            type: customExercise.type,
                                            bodyPart: customExercise.bodyPart
                                        };
                                        
                                        await WorkoutService.addExercise(newExercise);
                                        setPredefinedExercises(prev => [...prev, newExercise]);
                                        setFilteredExercises(prev => [...prev, newExercise]);
                                        setCustomExercise({ name: '', type: '', bodyPart: '' });
                                        setIsCustomExerciseModalVisible(false);
                                    } else {
                                        Alert.alert("Error", "Please fill in all fields");
                                    }
                                }}
                            >
                                <Text style={styles.saveExerciseButtonText}>Save Exercise</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isTimerModalVisible}
                    animationType="slide"
                    transparent={true}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.timerModalContainer, { backgroundColor: theme.surface }]}>
                            <View style={styles.timerModalHeader}>
                                <Text style={[styles.timerModalTitle, { color: theme.text }]}>Workout Timer</Text>
                                <TouchableOpacity onPress={() => setIsTimerModalVisible(false)}>
                                    <Icon name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.timerModeSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.timerModeButton,
                                        timerMode === 'stopwatch' && { backgroundColor: theme.primary },
                                    ]}
                                    onPress={() => setTimerMode('stopwatch')}
                                >
                                    <Text style={[
                                        styles.timerModeText,
                                        timerMode === 'stopwatch' && { color: '#fff' }
                                    ]}>
                                        Stopwatch
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.timerModeButton,
                                        timerMode === 'countdown' && { backgroundColor: theme.primary },
                                    ]}
                                    onPress={() => setTimerMode('countdown')}
                                >
                                    <Text style={[
                                        styles.timerModeText,
                                        timerMode === 'countdown' && { color: '#fff' }
                                    ]}>
                                        Countdown
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {timerMode === 'countdown' ? (
                                <View style={styles.countdownSettings}>
                                    {!countdownIsRunning ? (
                                        <>
                                            <Text style={[styles.countdownLabel, { color: theme.text }]}>
                                                Set Timer Duration:
                                            </Text>
                                            <View style={styles.countdownInput}>
                                                <View style={styles.timeInputGroup}>
                                                    <TouchableOpacity
                                                        style={[styles.countdownButton, { backgroundColor: theme.secondary }]}
                                                        onPress={() => setCountdownMinutes(prev => Math.min(prev + 1, 99))}
                                                    >
                                                        <Icon name="chevron-up" size={24} color="#fff" />
                                                    </TouchableOpacity>
                                                    <View style={styles.timeUnit}>
                                                        <Text style={[styles.countdownValue, { color: theme.text }]}>
                                                            {countdownMinutes.toString().padStart(2, '0')}
                                                        </Text>
                                                        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>min</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={[styles.countdownButton, { backgroundColor: theme.secondary }]}
                                                        onPress={() => setCountdownMinutes(prev => Math.max(prev - 1, 0))}
                                                    >
                                                        <Icon name="chevron-down" size={24} color="#fff" />
                                                    </TouchableOpacity>
                                                </View>

                                                <Text style={[styles.countdownValue, { color: theme.text }]}>:</Text>

                                                <View style={styles.timeInputGroup}>
                                                    <TouchableOpacity
                                                        style={[styles.countdownButton, { backgroundColor: theme.secondary }]}
                                                        onPress={() => setCountdownSecs(prev => Math.min(prev + 5, 59))}
                                                    >
                                                        <Icon name="chevron-up" size={24} color="#fff" />
                                                    </TouchableOpacity>
                                                    <View style={styles.timeUnit}>
                                                        <Text style={[styles.countdownValue, { color: theme.text }]}>
                                                            {countdownSecs.toString().padStart(2, '0')}
                                                        </Text>
                                                        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>sec</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={[styles.countdownButton, { backgroundColor: theme.secondary }]}
                                                        onPress={() => setCountdownSecs(prev => Math.max(prev - 5, 0))}
                                                    >
                                                        <Icon name="chevron-down" size={24} color="#fff" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </>
                                    ) : (
                                        <View style={styles.timerDisplay}>
                                            <Text style={[styles.countdownValue, { 
                                                color: theme.text,
                                                fontSize: 48,
                                                fontWeight: 'bold'
                                            }]}>
                                                {formatCountdownTime(countdownSeconds)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.timerDisplay}>
                                    <Text style={[styles.timerText, { color: theme.text }]}>
                                        {formatStopwatchTime(stopwatchSeconds, stopwatchMs)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.timerControls}>
                                <TouchableOpacity
                                    style={[
                                        styles.timerButton,
                                        { backgroundColor: theme.primary }
                                    ]}
                                    onPress={timerMode === 'countdown' ? 
                                        (countdownIsRunning ? stopCountdown : startCountdown) :
                                        (isStopwatchRunning ? stopStopwatch : startStopwatch)
                                    }
                                >
                                    <Text style={styles.timerButtonText}>
                                        {timerMode === 'countdown' ?
                                            (countdownIsRunning ? 'Stop' : 'Start') :
                                            (isStopwatchRunning ? 'Stop' : 'Start')
                                        }
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.timerButton,
                                        { backgroundColor: theme.secondary }
                                    ]}
                                    onPress={timerMode === 'countdown' ? resetCountdown : resetStopwatch}
                                >
                                    <Text style={styles.timerButtonText}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    picker: {
        backgroundColor: '#FF0000'
    }, 
    workoutNameInput: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
    addButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#1565C0',
        borderRadius: 5,
        alignSelf: 'center',
        width: '100%',
    },
    chatButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#4A90E2',
        borderRadius: 5,
        alignSelf: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '600'
    },
    modalView: {
        justifyContent: 'space-evenly',
        paddingTop: 40,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: '#f9f9f9',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingRight: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    addCustomExerciseButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#FFA000',
        borderRadius: 5,
        alignSelf: 'center',
        width: '100%',
    },
    buttonContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveCancelButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
    },
    saveButton: {
        backgroundColor: '#00C853',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 10,
        flex: 1,
    },
    cancelButton: {
        backgroundColor: '#FF6347',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        flex: 1,
    },
    customExerciseModalView: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    customExerciseForm: {
        flex: 1,
        zIndex: 1000,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    customInput: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: 8,
        height: 50,
    },
    dropdownContainer: {
        borderWidth: 1,
        borderRadius: 8,
        maxHeight: 150,
    },
    dropdownItem: {
        padding: 10,
    },
    customExerciseButtons: {
        paddingVertical: 20,
    },
    saveCustomExerciseButton: {
        backgroundColor: '#1565C0',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flexShrink: 1,
    },
    timerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingTop: 60,
    },
    timerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    timerText: {
        fontSize: 20,
        fontWeight: '500',
        color: '#666',
    },
    timerTextRunning: {
        color: '#FF6347',
    },
    startWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        flex: 1,
    },
    startWorkoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    addExerciseButton: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
    },
    primaryButton: {
        padding: 10,
        backgroundColor: '#1565C0',
        borderRadius: 5,
        alignItems: 'center',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    fab: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    addFab: {
        backgroundColor: '#1565C0',
    },
    chatFab: {
        backgroundColor: '#4A90E2',
    },
    saveFab: {
        backgroundColor: '#00C853',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingRight: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    closeButton: {
        padding: 12,
        marginTop: 40,
    },
    searchInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        margin: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    categoryPill: {
        width: 120,
        height: 45,
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        marginRight: 10,
        marginVertical: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        justifyContent: 'center',
    },
    exerciseItem: {
        padding: 15,
        backgroundColor: '#fff',
        height: 65,
        activeOpacity: 0.6,
        touchableOpacity: 0.8,
    },
    exerciseItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    exerciseDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
    },
    timerButtonRunning: {
        backgroundColor: '#FF6347',
    },
    timerButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    customExerciseButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    customExerciseButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    categoryPillSelected: {
        backgroundColor: '#1565C0',
        elevation: 4,
    },
    categoryPillText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
        textAlign: 'center',
    },
    categoryPillTextSelected: {
        color: '#fff',
    },
    categoryScroll: {
        paddingHorizontal: 10,
    },
    categoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    categoriesContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    exerciseListContainer: {
        flex: 1,
        height: 400,
        paddingHorizontal: 10,
    },
    exerciseList: {
        padding: 16,
        paddingBottom: 80,
    },
    timerFab: {
        backgroundColor: '#FF9800',
    },
    timerModalContainer: {
        width: '90%',
        padding: 20,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    timerModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    timerModalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    timerModeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    timerModeButton: {
        padding: 10,
        borderRadius: 20,
        width: '45%',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    timerModeText: {
        fontWeight: '500',
    },
    countdownSettings: {
        marginBottom: 20,
    },
    countdownLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    countdownInput: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    timeInputGroup: {
        alignItems: 'center',
    },
    timeUnit: {
        alignItems: 'center',
        marginVertical: 8,
    },
    countdownValue: {
        fontSize: 32,
        fontWeight: '600',
    },
    timeLabel: {
        fontSize: 12,
    },
    timerControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
    },
    timerButton: {
        padding: 12,
        borderRadius: 20,
        width: '35%',
        alignItems: 'center',
    },
    timerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    timerButtonStart: {
        backgroundColor: '#4CAF50',
    },
    timerButtonStop: {
        backgroundColor: '#FF5252',
    },
    timerDisplay: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        padding: 20,
        zIndex: 1000,
    },
    customInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: 8,
        height: 50,
    },
    dropdownContainer: {
        borderWidth: 1,
        borderRadius: 8,
        maxHeight: 150,
    },
    customExerciseActions: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    saveExerciseButton: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    saveExerciseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownSection: {
        marginBottom: 20,
        height: 90,
        position: 'relative',
        zIndex: 1000,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    timerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timerText: {
        fontSize: 20,
        fontWeight: '500',
    },
    startWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    startWorkoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    stopWorkoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NewWorkoutScreen;
