import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, TextInput } from 'react-native';
import ExercisePicker from '../components/ExercisePicker';
import WorkoutService from '../services/WorkoutService';
import ExerciseCard from '../components/ExerciseCard';
import { useChat } from './ChatContext';
import Exercise from '../models/Exercise';
import Set from '../models/Set';
import { ExerciseContext } from './ExerciseContext';7

const NewWorkoutScreen = ({ navigation }) => {
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

    useEffect(() => {
        navigation.setOptions({
            clearChatHistory,
        });
    }, [navigation, clearChatHistory]);

    const navigateToChatScreen = () => {
        navigation.navigate('Chat', { workoutExercises });
    };

    const addExerciseToWorkout = () => {
        const exerciseData = predefinedExercises.find(e => e.id === selectedExerciseId);
        if (exerciseData && !workoutExercises.some(e => e.id === exerciseData.id)) {
            const newExercise = new Exercise(exerciseData.id, exerciseData.name, exerciseData.type, exerciseData.bodyPart);
            setWorkoutExercises(prev => [...prev, newExercise]);
            setIsModalVisible(false);
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
        clearChatHistory();
        if (workoutExercises.length === 0) {
            Alert.alert("Empty Workout", "No exercises to save. Please add some exercises before saving.");
            return;
        }

        const workout = {
            name: workoutName || 'Unnamed Workout',
            id: `workout-${new Date().getTime()}`,
            date: new Date().toISOString(),
            exercises: workoutExercises
        };

        try {
            console.log("adding workout")
            await WorkoutService.addWorkout(workout);
            Alert.alert("Success", "Workout saved successfully!");
            setWorkoutExercises([]);
            setChatHistory([]);
            setWorkoutName('');
            navigation.navigate('History');
        } catch (error) {
            Alert.alert("Error", "Failed to save the workout. Please try again.");
            console.error("Failed to save workout:", error);
        }
    };

    const clearWorkout = () => {
        clearChatHistory();
        setWorkoutExercises([]);
        setWorkoutName('');
    };

    const handleAddCustomExercise = () => {
        console.log("handleAddCustomExercise called");
        setIsModalVisible(false);
        setIsCustomExerciseModalVisible(true);
    };

    const saveCustomExercise = async () => {
        console.log("saveCustomExercise called");
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

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.workoutNameInput}
                placeholder="Enter Workout Name"
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholderTextColor="#ccc"
            />
            <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addButton}>
                <Text style={styles.buttonText}>Add Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={navigateToChatScreen} style={styles.chatButton}>
                <Text style={styles.buttonText}>Ask Coach</Text>
            </TouchableOpacity>
            <FlatList
                data={workoutExercises}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <ExerciseCard
                        exercise={item}
                        sets={item.sets}
                        onAddSet={addSetToExercise}
                        onDeleteSet={deleteSetFromExercise}
                        onDeleteExercise={deleteExercise} 
                    />
                )}
                contentContainerStyle={{ alignItems: 'stretch' }}
            />
            <View style={styles.saveCancelButtonContainer}>
                <TouchableOpacity onPress={saveWorkout} style={styles.saveButton}>
                    <Text style={styles.buttonText}>Save Workout</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearWorkout} style={styles.cancelButton}>
                    <Text style={styles.buttonText}>Cancel Workout</Text>
                </TouchableOpacity>
            </View>
            <Modal
                animationType="slide"
                transparent={false}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <ExercisePicker
                            exercises={predefinedExercises}
                            selectedValue={selectedExerciseId}
                            onChange={setSelectedExerciseId}
                        />
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={handleAddCustomExercise} style={styles.addCustomExerciseButton}>
                            <Text style={styles.buttonText}>Add Custom Exercise</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={addExerciseToWorkout} style={styles.addButton}>
                            <Text style={styles.buttonText}>Add</Text>
                        </TouchableOpacity>
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
                    <Text style={styles.formTitle}>Add Custom Exercise</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter exercise name"
                        placeholderTextColor={styles.placeholderTextColor}
                        value={customExercise.name}
                        onChangeText={(text) => setCustomExercise({ ...customExercise, name: text })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter exercise type"
                        placeholderTextColor={styles.placeholderTextColor}
                        value={customExercise.type}
                        onChangeText={(text) => setCustomExercise({ ...customExercise, type: text })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter body part"
                        placeholderTextColor={styles.placeholderTextColor}
                        value={customExercise.bodyPart}
                        onChangeText={(text) => setCustomExercise({ ...customExercise, bodyPart: text })}
                    />
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={saveCustomExercise} style={styles.saveButton}>
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsCustomExerciseModalVisible(false)} style={styles.cancelButton}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    picker: {
        backgroundColor: '#FF0000'
    }, 
    workoutNameInput: {
        fontSize: 18,
        marginBottom: 20,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
        color: '#333333',
        width: '100%',
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
        width: '100%',
        color: '#000',  
    },
    placeholderTextColor: '#333',  
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '100%',
    },
    saveButtonText: {
        backgroundColor: '#00C853',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 10,
        flex: 1,
    },
    cancelButtonText: {
        backgroundColor: '#FF6347',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        flex: 1,
    }
});

export default NewWorkoutScreen;
