import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, TextInput, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
    const [selectedExerciseId, setSelectedExerciseId] = useState(null);
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
        };
    }, []);

    useEffect(() => {
        if (route.params?.templateWorkout) {
            const template = route.params.templateWorkout;
            setWorkoutName(template.name + ' (Copy)');
            
            const copiedExercises = template.exercises.map(ex => {
                const newExercise = new Exercise(
                    ex.id,
                    ex.name,
                    ex.type,
                    ex.bodyPart
                );
                
                ex.sets.forEach(() => {
                    newExercise.addSet(new Set(0, 0));
                });
                
                return newExercise;
            });
            
            setWorkoutExercises(copiedExercises);
        }
    }, [route.params?.templateWorkout]);

    const navigateToChatScreen = () => {
        navigation.navigate('Chat', { workoutExercises });
    };

    const addExerciseToWorkout = () => {
        if (!selectedExerciseId) return;
        
        const exerciseData = predefinedExercises.find(e => e.id === selectedExerciseId);
        if (exerciseData && !workoutExercises.some(e => e.id === exerciseData.id)) {
            const newExercise = new Exercise(
                exerciseData.id, 
                exerciseData.name, 
                exerciseData.type, 
                exerciseData.bodyPart
            );
            setWorkoutExercises(prev => [...prev, newExercise]);
            setIsModalVisible(false);
            setSelectedExerciseId(null);
        }
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

    const saveWorkout = async () => {
        if (workoutExercises.length === 0) {
            Alert.alert(
                "Empty Workout", 
                "No exercises to save. Please add some exercises before saving.",
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
                        const duration = timerSeconds;
                        stopTimer();
                        setTimerSeconds(0);
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
                id: predefinedExercises.length + 1,
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
        const filtered = predefinedExercises.filter(exercise => 
            exercise.name.toLowerCase().includes(query.toLowerCase()) ||
            exercise.bodyPart.toLowerCase().includes(query.toLowerCase()) ||
            exercise.type.toLowerCase().includes(query.toLowerCase())
        );
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

    const filterByCategory = async (category) => {
        setSelectedCategory(category);
        try {
            if (category === 'All') {
                const allExercises = await WorkoutService.getExercises();
                setFilteredExercises(allExercises);
            } 
            else if (category === 'Recent') {
                // Dohvati zadnje workoute
                const workouts = await WorkoutService.getWorkouts();
                const recentExercises = new Set();
                
                // Uzmi zadnjih 5 različitih vježbi iz povijesti
                workouts.reverse().forEach(workout => {
                    workout.exercises.forEach(exercise => {
                        if (recentExercises.size < 5) {
                            recentExercises.add(JSON.stringify(exercise));
                        }
                    });
                });
                
                const uniqueRecentExercises = Array.from(recentExercises).map(ex => JSON.parse(ex));
                setFilteredExercises(uniqueRecentExercises);
            } 
            else {
                // Koristi novu metodu za dohvaćanje vježbi po kategoriji
                const categoryExercises = await WorkoutService.getExercisesByCategory(category);
                setFilteredExercises(categoryExercises);
            }
        } catch (error) {
            console.error('Error filtering exercises:', error);
            setFilteredExercises([]);
        }
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

    const startCountdown = () => {
        if (!countdownIsRunning) {
            setCountdownIsRunning(true);
            const totalSeconds = countdownMinutes * 60 + countdownSecs;
            setCountdownSeconds(totalSeconds);
            
            countdownRef.current = setInterval(() => {
                setCountdownSeconds(prev => {
                    if (prev <= 0) {
                        stopCountdown();
                        // Jednostavna obavijest koja se može zatvoriti
                        Alert.alert(
                            "Time's up!",
                            "Countdown finished",
                            [{ text: "OK" }]
                        );
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
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

    const renderFABs = () => (
        <View style={styles.fabContainer}>
            {/* Timer FAB */}
            <TouchableOpacity
                style={[
                    styles.fab,
                    {
                        backgroundColor: theme.accent,
                        borderRadius: 28,
                        borderBottomRightRadius: 0, // Drugačiji oblik za timer
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

            {/* Save FAB */}
            <TouchableOpacity
                style={[
                    styles.fab,
                    {
                        backgroundColor: theme.primary,
                        borderRadius: 28,
                        transform: [{ rotate: '45deg' }],
                    }
                ]}
                onPress={saveWorkout}
            >
                <Icon
                    name="heart"
                    size={24}
                    color="#fff"
                    style={{ transform: [{ rotate: '-45deg' }] }}
                />
            </TouchableOpacity>

            {/* Add Exercise FAB */}
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

            {/* Chat FAB */}
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

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.timerSection, { backgroundColor: theme.surface }]}>
                    <View style={styles.timerContent}>
                        <Icon 
                            name="timer-outline" 
                            size={22} 
                            color={isTimerRunning ? theme.error : theme.textSecondary} 
                        />
                        <Text style={[
                            styles.timerText, 
                            isTimerRunning && { color: theme.error }
                        ]}>
                            {formatTime(timerSeconds)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.startWorkoutButton, { backgroundColor: theme.primary }]}
                        onPress={openTimerModal}
                    >
                        <Icon 
                            name={isTimerRunning ? "pause-circle" : "play-circle"} 
                            size={22} 
                            color="#fff" 
                        />
                        <Text style={styles.startWorkoutButtonText}>
                            {isTimerRunning ? 'Pause Workout' : 'Start Workout'}
                        </Text>
                    </TouchableOpacity>
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
                    presentationStyle="pageSheet"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Exercise</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Icon name="close" size={24} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search exercises..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />

                        <View style={styles.categoriesContainer}>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false} 
                                style={styles.categoryScroll}
                            >
                                {['All', 'Recent', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders'].map(category => (
                                    <TouchableOpacity 
                                        key={category}
                                        style={[
                                            styles.categoryPill,
                                            selectedCategory === category && styles.categoryPillSelected
                                        ]}
                                        onPress={() => filterByCategory(category)}
                                    >
                                        <View style={styles.categoryContent}>
                                            <Icon 
                                                name={categoryIcons[category]} 
                                                size={16} 
                                                color={selectedCategory === category ? '#fff' : '#666'} 
                                            />
                                            <Text style={[
                                                styles.categoryPillText,
                                                selectedCategory === category && styles.categoryPillTextSelected
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
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.exerciseItem}
                                        onPress={() => {
                                            setSelectedExerciseId(item.id);
                                            addExerciseToWorkout();
                                        }}
                                    >
                                        <View style={styles.exerciseItemContent}>
                                            <View>
                                                <Text style={styles.exerciseName}>{item.name}</Text>
                                                <Text style={styles.exerciseDetail}>{item.bodyPart} • {item.type}</Text>
                                            </View>
                                            <Icon name="add-circle-outline" size={24} color="#1565C0" />
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                ListFooterComponent={
                                    <TouchableOpacity 
                                        style={styles.customExerciseButton}
                                        onPress={handleAddCustomExercise}
                                    >
                                        <Text style={styles.customExerciseButtonText}>+ Add Custom Exercise</Text>
                                    </TouchableOpacity>
                                }
                            />
                        </View>
                    </View>
                </Modal>

                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={isCustomExerciseModalVisible}
                    onRequestClose={() => setIsCustomExerciseModalVisible(false)}
                >
                    <View style={styles.customExerciseModalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.formTitle}>Add Custom Exercise</Text>
                            <TouchableOpacity onPress={() => setIsCustomExerciseModalVisible(false)}>
                                <Icon name="close" size={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.customExerciseForm}>
                            <Text style={styles.inputLabel}>Exercise Name</Text>
                            <TextInput
                                style={styles.customInput}
                                placeholder="Enter exercise name"
                                placeholderTextColor="#999"
                                value={customExercise.name}
                                onChangeText={(text) => setCustomExercise(prev => ({ ...prev, name: text }))}
                            />

                            <Text style={styles.inputLabel}>Type</Text>
                            <DropDownPicker
                                open={openType}
                                value={customExercise.type}
                                items={exerciseTypes}
                                setOpen={setOpenType}
                                setValue={(value) => setCustomExercise(prev => ({ ...prev, type: value() }))}
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                listItemContainerStyle={styles.dropdownItem}
                                placeholder="Select type"
                                placeholderStyle={{
                                    color: "#999"
                                }}
                                zIndex={2000}
                            />

                            <Text style={styles.inputLabel}>Body Part</Text>
                            <DropDownPicker
                                open={openBodyPart}
                                value={customExercise.bodyPart}
                                items={bodyParts}
                                setOpen={setOpenBodyPart}
                                setValue={(value) => setCustomExercise(prev => ({ ...prev, bodyPart: value() }))}
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                listItemContainerStyle={styles.dropdownItem}
                                placeholder="Select body part"
                                placeholderStyle={{
                                    color: "#999"
                                }}
                                zIndex={1000}
                            />
                        </View>

                        <View style={styles.customExerciseButtons}>
                            <TouchableOpacity 
                                onPress={saveCustomExercise} 
                                style={styles.saveCustomExerciseButton}
                                disabled={!customExercise.name || !customExercise.type || !customExercise.bodyPart}
                            >
                                <Text style={styles.buttonText}>Save Exercise</Text>
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
                                    <Text style={[styles.countdownLabel, { color: theme.text }]}>Set Timer Duration:</Text>
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
                                        timerMode === 'stopwatch' ? 
                                            (isStopwatchRunning ? styles.timerButtonStop : styles.timerButtonStart) :
                                            (countdownIsRunning ? styles.timerButtonStop : styles.timerButtonStart),
                                        { backgroundColor: theme.primary }
                                    ]}
                                    onPress={timerMode === 'stopwatch' ? 
                                        (isStopwatchRunning ? stopStopwatch : startStopwatch) :
                                        (countdownIsRunning ? stopCountdown : startCountdown)
                                    }
                                >
                                    <Text style={styles.timerButtonText}>
                                        {timerMode === 'stopwatch' ?
                                            (isStopwatchRunning ? 'Stop' : 'Start') :
                                            (countdownIsRunning ? 'Stop' : 'Start')
                                        }
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.timerButton, { backgroundColor: theme.secondary }]}
                                    onPress={timerMode === 'stopwatch' ? resetStopwatch : resetCountdown}
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
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
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
        paddingTop: 20,
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
        borderColor: '#ddd',
        borderRadius: 8,
        height: 50,
    },
    dropdownContainer: {
        borderColor: '#ddd',
        borderRadius: 8,
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
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
        backgroundColor: '#1565C0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    startWorkoutButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
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
        backgroundColor: '#f9f9f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
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
        marginTop: 20,
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#FFA000',
        borderRadius: 5,
        alignItems: 'center',
    },
    customExerciseButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
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
        marginVertical: 20,
        width: '100%',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NewWorkoutScreen;
