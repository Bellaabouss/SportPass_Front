import React, { useState, useEffect } from 'react';
import { View, Alert, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import PostComponent from '../../components/PostComponent.js';
import { AntDesign } from '@expo/vector-icons';
import CommentComponent from '../../components/CommentComponent.js';
import EditActions from '../../components/EditActionsComponent.js';
import MessageModal from '../../components/MessageModal.js';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import URLS from '../../urlConfig.js';

moment.locale('fr');

const PostDetailsPage = ({ route, navigation }) => {
    const { post } = route.params;
    const [comments, setComments] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [inputHeight, setInputHeight] = useState(0);
    const [selectedComment, setSelectedComment] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isBlurEffect, setIsBlurEffect] = useState(false);
    const [postComponentHeight, setPostComponentHeight] = useState(0); 
    const [iduser, setIduser] = useState(null);
      
    const getUserId = async () => {
        const idUser = await AsyncStorage.getItem('userId');
        setIduser(idUser)
    };

    const openModal = (edit, commentId, content) => {
        setIsEditMode(edit);
        setEditingCommentId(commentId);
        setMessageText(content);
        setModalVisible(true);
        setIsBlurEffect(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setIsBlurEffect(false);
    };

    const sendMessage = async () => {
        if (messageText.trim() === '') {
            Alert.alert('Erreur', 'Le message ne peut pas être vide.');
            return;
        }

        const messageData = {
            contenu: messageText,
            date: new Date().toISOString(),
            idPublication: post.idPublication,
            idUser: iduser
        };

        if (isEditMode) {
            editComment(editingCommentId, messageText);
            closeModal();
        } else {
            try {
                const response = await axios.post(`${URLS.url}/commentaireUser`, messageData);
                setMessageText('');
                closeModal();
                fetchCommentsAndUsers();
                setUpdateTrigger(updateTrigger + 1);

            } catch (error) {
                console.error('Erreur lors de l\'envoi du message', error);
                Alert.alert('Erreur', 'Un problème est survenu lors de l\'envoi du message.');
            }
        }
    };

    const adjustInputHeight = (event) => {
        setInputHeight(event.nativeEvent.contentSize.height);
    };

    const adjustInputHeightPost = (event) => {
        setPostComponentHeight(event.nativeEvent.contentSize.height);
    };

    const fetchCommentsAndUsers = async () => {
        try {
            const commentsResponse = await axios.get(`${URLS.url}/commentaireUser/publication/${post.idPublication}`);
            let commentsWithDetails = await Promise.all(commentsResponse.data.map(async (comment) => {
                try {
                    const userResponse = await axios.get(`${URLS.url}/user/${comment.idUser}`);
                    const likesResponse = await axios.get(`${URLS.url}/likeCommentaireUser/commentaire/${comment.idCommentaire}`);
                    const isLikedByCurrentUser = await checkIfLikedByCurrentUser(comment.idCommentaire, iduser);
                    return {
                        ...comment,
                        likes: likesResponse.data.length,
                        userPseudo: userResponse.data.pseudo,
                        isLikedByCurrentUser: isLikedByCurrentUser.exists,
                    };
                } catch (error) {
                    console.error('Error fetching user details for comments', error);
                    return comment;
                }
            }));

            commentsWithDetails.sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());

            setComments(commentsWithDetails);
        } catch (error) {
            console.error('Error fetching comments', error);
        }
    };

    const handleCommentLongPress = (comment) => {
        setSelectedComment(comment);
        setIsEditModalVisible(true);
        setIsBlurEffect(true);
    };

    const renderBlurOverlay = () => (
        <TouchableOpacity
            style={[styles.blurOverlay, { display: isBlurEffect ? 'flex' : 'none' }]}
            onPress={() => {
                setIsBlurEffect(false);
                setIsEditModalVisible(false);
                setSelectedComment(null);
            }}
            activeOpacity={1}
        />
    );

    const handleEditComment = async () => {
        if (messageText.trim() === '') {
            Alert.alert('Erreur', 'Le message ne peut pas être vide.');
            return;
        }

        const updatedComment = {
            contenu: messageText,
            date: new Date().toISOString(),
        };

        try {
            await axios.put(`${URLS.url}/commentaireUser/${editingCommentId}`, updatedComment);
            fetchCommentsAndUsers();
            closeModal();
        } catch (error) {
            console.error('Error updating comment:', error);
            Alert.alert('Error', 'An error occurred while updating the comment');
        }
    };

    const renderMessageModal = () => {
        if (!isModalVisible) return null;
        return (
            <View style={styles.messageModalStyle}>
                <MessageModal
                    isModalVisible={isModalVisible}
                    closeModal={closeModal}
                    messageText={messageText}
                    setMessageText={setMessageText}
                    sendMessage={isEditMode ? handleEditComment : sendMessage}
                    adjustInputHeight={adjustInputHeight}
                    inputHeight={inputHeight}
                    post={post}
                    adjustInputHeightPost={adjustInputHeightPost}
                    postComponentHeight={postComponentHeight}
                />
            </View>
        );
    };

    const renderSelectedComment = () => {
        if (!selectedComment || !isEditModalVisible) return null;
        return (
            <View style={styles.editModal}>
                <CommentComponent
                    comment={selectedComment}
                    onLongPress={() => { }}
                />
                <EditActions
                    onClose={() => {
                        setIsEditModalVisible(false);
                        setIsBlurEffect(false);
                        setSelectedComment(null);
                    }}
                    onEdit={() => {
                        openModal(true, selectedComment.idCommentaire, selectedComment.contenu);
                        setIsEditModalVisible(false);
                    }}
                    onDelete={() => {
                        deleteComment(selectedComment.idCommentaire);
                        setIsEditModalVisible(false);
                        setIsBlurEffect(false);
                        setSelectedComment(null);
                    }}
                />
            </View>
        );
    };

    const editComment = async (commentId, newContent) => {
        const updatedComment = {
            contenu: newContent,
            date: new Date().toISOString(),
        };

        try {
            await axios.put(`${URLS.url}/commentaireUser/${commentId}`, updatedComment);
            fetchCommentsAndUsers();
        } catch (error) {
            console.error('Error updating comment:', error);
            Alert.alert('Error', 'An error occurred while updating the comment');
        }
    };

    const deleteComment = async (commentId) => {
        try {
            const response = await axios.delete(`${URLS.url}/commentaireUser/${commentId}`);
            fetchCommentsAndUsers();
            setUpdateTrigger(updateTrigger + 1);
        } catch (error) {
            console.error('Error delete commenataire', error);
            return false;
        }
    };

    useEffect(() => {
        getUserId();
        fetchCommentsAndUsers();
    }, [post.idPublication]);

    const checkIfLikedByCurrentUser = async (commentId, idUser) => {
        try {
            const response = await axios.get(`${URLS.url}/likeCommentaireUser/${commentId}/${idUser}`);
            return response.data;
        } catch (error) {
            console.error('Error checking like status', error);
            return false;
        }
    };

    const handleLike = async (commentId, isLiked) => {
        try {
            let updatedComments = [...comments];
            const commentIndex = updatedComments.findIndex(comment => comment.idCommentaire === commentId);
            if (commentIndex !== -1) {
                if (isLiked) {
                    await axios.delete(`${URLS.url}/likeCommentaireUser/${commentId}/${iduser}`);
                    updatedComments[commentIndex].isLikedByCurrentUser = false;
                    updatedComments[commentIndex].likes -= 1;
                } else {
                    const likeData = {
                        idCommentaire: commentId,
                        idUser: iduser
                    };
                    await axios.post(`${URLS.url}/likeCommentaireUser`, likeData);
                    updatedComments[commentIndex].isLikedByCurrentUser = true;
                    updatedComments[commentIndex].likes += 1;
                }
                setComments(updatedComments);
            }
        } catch (error) {
            console.error('Error updating like status', error);
        }
    };

    useEffect(() => {
        if (route.params?.showModal) {
            setModalVisible(true);
            setIsBlurEffect(true);
            if (route.params.post) {
                setMessageText(''); 
            }
        }
    }, [route.params]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {renderBlurOverlay()}
            {renderSelectedComment()}
            {renderMessageModal()}
            <View style={styles.wrapper}>
                <ScrollView style={[styles.container, isBlurEffect ? styles.blurredBackground : null]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                        <AntDesign name="arrowleft" size={26} color="#BD4F6C" />
                    </TouchableOpacity>
                    <View style={styles.container2}>
                        <View style={styles.premiercontainer}>
                        <PostComponent
                            post={post}
                            updateTrigger={updateTrigger}
                            onPostPress={() => navigation.navigate('PostDetails', { post })}
                            openModal={openModal}  
                            onLongPress={() => iduser === post.idUser ? handleLongPressOnPost(post) : null}
                        />
                            {comments.map((comment, index) => (
                                <CommentComponent
                                    key={index}
                                    comment={comment}
                                    onLongPress={() => comment.idUser == iduser ? handleCommentLongPress(comment) : null}
                                    onLikePress={() => handleLike(comment.idCommentaire, comment.isLikedByCurrentUser)}
                                    isLikedByCurrentUser={comment.isLikedByCurrentUser}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>
                <TouchableOpacity
                    onPress={() => openModal(false, null, '')}
                    style={styles.newMessageIcon}
                >
                    <FontAwesome5 name="comment" size={30} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        marginBottom:  "15%"
    },
    container2: {
        backgroundColor: "white",
        marginTop: "10%",
        borderRadius: 10,
        marginBottom: "20%"

    },
    backButtonContainer: {
        marginLeft: "4%",
        marginTop: "8%",
    },
    wrapper: {
        flex: 1,
        position: 'relative',
    },
    newMessageIcon: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        padding: 10,
        borderRadius: 50,
        backgroundColor: "#BD4F6C",
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 5,
    },
    editModal: {
        position: 'absolute',
        zIndex: 10,
        width: '90%',
        alignSelf: 'center',
        marginTop: '70%',
    },
    messageModalStyle: {
        zIndex: 100,
    },
});

export default PostDetailsPage;