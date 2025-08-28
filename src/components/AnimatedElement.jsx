import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/AnimatedElement.css';

const AnimatedElement = ({ 
  children, 
  animation = 'fade-in-up', 
  delay = 0, 
  className = '', 
  tag = 'div',
  ...props 
}) => {
  const scrollRef = useScrollAnimation();
  
  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'fade-in-up': 'animate-fade-in-up',
    'slide-in-right': 'animate-slide-in-right',
    'slide-in-left': 'animate-slide-in-left',
    'scale-in': 'animate-scale-in',
    'bounce-in': 'animate-bounce-in',
    'fade-in-on-scroll': 'fade-in-on-scroll'
  };

  const delayClasses = {
    0: '',
    1: 'stagger-1',
    2: 'stagger-2',
    3: 'stagger-3',
    4: 'stagger-4',
    5: 'stagger-5'
  };

  const classes = [
    animationClasses[animation] || 'animate-fade-in-up',
    delayClasses[delay] || '',
    className
  ].filter(Boolean).join(' ');

  const Tag = tag;

  return (
    <Tag 
      ref={scrollRef}
      className={classes}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default AnimatedElement;
