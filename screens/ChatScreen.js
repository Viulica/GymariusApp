import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    FlatList, 
    StyleSheet, 
    TouchableOpacity,
    KeyboardAvoidingView, 
    Platform,
    ActivityIndicator
} from 'react-native';
import { useChat } from '../contexts/ChatContext';
import { askChatbot } from '../services/ChatbotService';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatScreen = ({ route }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { chatHistory, setChatHistory } = useChat();
    const {workoutExercises} = route.params;
    const flatListRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input.trim() };
        const updatedHistory = [...chatHistory, userMessage];
        setInput('');
        setIsLoading(true);

        try {
            const parsedContent = parseContent(workoutExercises);
            const botResponse = await askChatbot([...updatedHistory, userMessage], parsedContent);
            setChatHistory([...updatedHistory, { role: 'system', content: botResponse }]);
        } catch (error) {
            console.error('Error:', error);
            setChatHistory([
                ...updatedHistory, 
                { role: 'system', content: "Failed to fetch response. Please try again later." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    function parseContent(workoutExercises) {
        const prompt = "INSTRUCTIONS: You are a fitness AI coach..."; // Postojeći prompt
        const exercisesData = workoutExercises.map(exercise => ({
            id: exercise.id,
            name: exercise.name,
            type: exercise.type,
            bodyPart: exercise.bodyPart,
            sets: exercise.getNumberOfSets(),
            setsDetails: exercise.sets.map(set => [set.weight, set.reps])
        }));
        return {
            role: 'system',
            content: prompt + ' ' + JSON.stringify(exercisesData)
        };
    }

    const renderMessage = ({ item }) => (
        <View style={[
            styles.messageContainer,
            item.role === 'user' ? 
                [styles.userMessageContainer, { backgroundColor: theme.primary }] : 
                [styles.systemMessageContainer, { backgroundColor: theme.surface }],
            { marginBottom: 12 }
        ]}>
            <Text style={[
                styles.messageText,
                item.role === 'user' ? 
                    { color: '#fff' } : 
                    { color: theme.text }
            ]}>
                {item.content}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={90}
        >
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <Text style={[
                    styles.headerTitle, 
                    { 
                        color: theme.text,
                        fontFamily: theme.titleFont 
                    }
                ]}>
                    AI Trainer
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    Ask me anything about fitness!
                </Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={chatHistory}
                renderItem={renderMessage}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.chatContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
                <TextInput
                    style={[
                        styles.input,
                        { 
                            backgroundColor: theme.background,
                            color: theme.text,
                            borderColor: theme.border
                        }
                    ]}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type your message..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                />
                <TouchableOpacity 
                    onPress={handleSend}
                    style={[styles.sendButton, { backgroundColor: theme.primary }]}
                    disabled={isLoading || !input.trim()}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Icon name="send" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 45,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    chatContainer: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 20,
        marginVertical: 4,
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    systemMessageContainer: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        paddingRight: 40,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;