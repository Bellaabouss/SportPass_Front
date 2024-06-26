import React,{useRef} from "react";
import {TouchableOpacity,Text,View,StyleSheet,Animated} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Checkbox = ({
    text, onPress, isChecked, containerStyle, textStyle, checkboxStyle,
}) => {

    const animatedWidth= useRef(new Animated.Value(0)).current;

    const startAnimation = () =>{
        const toValue = isChecked ? 0:30;
        Animated.timing(animatedWidth,{
            toValue:toValue,
            duration:500,
            useNativeDriver:false,
        }).start();
    }

    return(
        <View style= {[styles.container,containerStyle]}>
            <Text style={[styles.checkboxText, textStyle]}>{text}</Text>
            <TouchableOpacity 
                onPress={()=>{
                    startAnimation();
                    onPress();
                }}  
                style= {[styles.checkbox, isChecked && styles.checkboxSelected, checkboxStyle,]}>
                <Animated.View style ={{width:animatedWidth}}> 
                <Ionicons name="checkmark" size={17} color="white" />                
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        alignItems:'center',
    },
    checkbox:{
        borderColor: '#008900',
        borderWidth :1,
        borderRadius: 6,
        height: 18,
        width:18,
        marginTop:1.5,
    },
    checkboxSelected : {
        backgroundColor:'#008900',
    },
    checkboxText:{
        fontSize:16,
        marginRight:7,
        color:'#008900',
        fontWeight:'bold',
    },
});


export default Checkbox;