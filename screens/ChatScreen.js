import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { askChatbot } from '../services/ChatbotService';
import { useIsFocused } from '@react-navigation/native';
import { useChat } from './ChatContext';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { parse } from 'react-native-svg';

const ChatScreen = ({ route }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isFocused = useIsFocused();
    const { chatHistory, setChatHistory } = useChat();
    const {workoutExercises} = route.params;
    const flatListRef = useRef(null);

    const clearChatHistory = () => {
        setChatHistory([]);
    };    

    function parseContent(workoutExercises) {
        const prompt = "INSTRUCTIONS: You are a fitness AI coach. You respond to users fitness-related questions. Before the questions I will provide you with some context data about what workout the user currently has active. This data I'm about to send you is data of a user's current workout so if they ask you questions about it, have that in mind. The setsDetails property's first number represents the weight, and the second number the number of reps for that set. unles the user asks you something specifically related to the exercises/workout they are doing right now, don't talk about it, just answer the questions as you normally would. Do not respond anything ever to my instructions, only respond to user questions. There are 2 possible response types: 1) The user asks a general question, if the question is not related to fitness, you should say you are a fitness AI chatbot only and cant respond to that question. 2) The user asks a question that is related to their current workout, if so, keep the workout data in mind and anwser accordingly using both your overall general fitness knowledge and the knowdlege you have about the current workout of the user. DO NOT write MARKDOWN (# and ** signs to make headings and bold text or anything similar..) by the way, only write plaintext that can be nicely rendered just by printing out. [END OF INSTRUCTIIONS (keep them in mind but dont anwser to them, anwser to the user, act like you did not read the instructions but just understand them)]"
        const exercisesData = workoutExercises.map(exercise => {
            return {
                id: exercise.id,
                name: exercise.name,
                type: exercise.type,
                bodyPart: exercise.bodyPart,
                sets: exercise.getNumberOfSets(),
                setsDetails: exercise.sets.map(set => [set.weight, set.reps])
            };
        });
        return {
            role: 'system',
            content: prompt + ' ' + JSON.stringify(exercisesData)
        };
    }


    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [chatHistory]);
    
    const handleSend = async () => {
        if (!input.trim()) {
            return;
        }
        const parsedContent = parseContent(workoutExercises);
        const userMessage = { role: 'user', content: input.trim() };
        const updatedHistory = [...chatHistory, userMessage];
        setInput('');
        setIsLoading(true);
        try {
            const botResponse = await askChatbot([...updatedHistory, userMessage], parsedContent);
            setChatHistory([...updatedHistory, { role: 'system', content: botResponse }]);
        } catch (error) {
            console.error('Error:', error);
            setChatHistory([...updatedHistory, { role: 'system', content: "Failed to fetch response. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };
    const renderItem = ({ item }) => (
        <View style={[styles.messageContainer, item.role === 'user' ? styles.userMessageContainer : styles.systemMessageContainer]}>
            <Text style={item.role === 'user' ? styles.userMessage : styles.systemMessage}>
                {item.role === 'user' ? `You: ${item.content}` : item.content}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={100}
        >
            <FlatList
                ref={flatListRef}
                data={chatHistory}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
                contentContainerStyle={styles.chatContent}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    style={styles.input}
                    placeholder="Type a message..."
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatContent: {
        paddingBottom: 100, 
    },
    inputContainer: {
        padding: 10,
        paddingBottom: 20, 
        backgroundColor: '#fff', 
    },
    messageContainer: {
        marginVertical: 5,
        paddingHorizontal: 10,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    systemMessageContainer: {
        alignItems: 'flex-start',
    },
    userMessage: {
        backgroundColor: '#D1E8FF',
        padding: 10,
        borderRadius: 10,
        color: '#000',
    },
    systemMessage: {
        backgroundColor: '#FFF1CC',
        padding: 10,
        borderRadius: 10,
        color: '#000',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10,
        backgroundColor: '#fff', 
    },
});

export default ChatScreen;