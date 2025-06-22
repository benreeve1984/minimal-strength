'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Settings, CheckCircle, Plus } from 'lucide-react'

// Define the structure for an exercise
interface Exercise {
  name: string
  sets: number[]  // Array of reps for each set
  currentSet: number
  completed: boolean
}

// Define the structure for workout data stored in localStorage
interface WorkoutData {
  exercises: Exercise[]
  timerDuration: number  // in seconds
}

export default function WorkoutPage() {
  // Main workout state - stores current exercises and their progress
  const [exercises, setExercises] = useState<Exercise[]>([])
  
  // Timer state management
  const [timerSeconds, setTimerSeconds] = useState(60) // Default 1 minute
  const [timerActive, setTimerActive] = useState(false)
  const [timerDuration, setTimerDuration] = useState(60) // User-configurable timer duration
  
  // UI state management
  const [showSettings, setShowSettings] = useState(false)
  const [workoutComplete, setWorkoutComplete] = useState(false)
  
  // Audio context for timer sound (initialized on first user interaction)
  const audioContextRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Initialize workout data on component mount
  useEffect(() => {
    loadWorkoutData()
  }, []) // loadWorkoutData is stable - no need to add as dependency

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null

    if (timerActive && timerSeconds > 0) {
      // Request wake lock to prevent screen from turning off during timer
      requestWakeLock()
      
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds - 1)
      }, 1000)
    } else if (timerSeconds === 0 && timerActive) {
      // Timer finished - play sound, vibrate, and stop
      playTimerSound()
      vibrateDevice()
      setTimerActive(false)
      setTimerSeconds(timerDuration)
      releaseWakeLock()
    } else {
      // Timer not active - release wake lock
      releaseWakeLock()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timerSeconds, timerDuration])

  // Load workout data from localStorage or initialize with default
  const loadWorkoutData = () => {
    try {
      const savedData = localStorage.getItem('minimalStrengthWorkout')
      if (savedData) {
        const data: WorkoutData = JSON.parse(savedData)
        setExercises(data.exercises)
        setTimerDuration(data.timerDuration)
        setTimerSeconds(data.timerDuration)
      } else {
        // Initialize with default workout: 5 sets of 1 rep each for pull-ups and dips
        initializeDefaultWorkout()
      }
    } catch (error) {
      console.error('Error loading workout data:', error)
      initializeDefaultWorkout()
    }
  }

  // Initialize default workout structure
  const initializeDefaultWorkout = () => {
    const defaultExercises: Exercise[] = [
      {
        name: 'Pull-ups',
        sets: [1, 1, 1, 1, 1], // 5 sets of 1 rep each
        currentSet: 0,
        completed: false
      },
      {
        name: 'Dips',
        sets: [1, 1, 1, 1, 1], // 5 sets of 1 rep each
        currentSet: 0,
        completed: false
      }
    ]
    setExercises(defaultExercises)
    setTimerDuration(60)
    setTimerSeconds(60)
  }

  // Save current workout state to localStorage
  const saveWorkoutData = (updatedExercises: Exercise[]) => {
    const data: WorkoutData = {
      exercises: updatedExercises,
      timerDuration
    }
    localStorage.setItem('minimalStrengthWorkout', JSON.stringify(data))
  }

  // Handle completing a set for an exercise
  const completeSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises]
    const exercise = updatedExercises[exerciseIndex]
    
    // Move to next set
    exercise.currentSet += 1
    
    // Check if all sets are completed for this exercise
    if (exercise.currentSet >= exercise.sets.length) {
      exercise.completed = true
    }
    
    setExercises(updatedExercises)
    saveWorkoutData(updatedExercises)
    
    // Check if entire workout is complete (for UI purposes)
    const allCompleted = updatedExercises.every(ex => ex.completed)
    setWorkoutComplete(allCompleted)
    
    // Start rest timer automatically after completing a set (but not if exercise is fully complete)
    if (!exercise.completed) {
      startTimer()
    }
  }

  // Start the rest timer
  const startTimer = () => {
    setTimerSeconds(timerDuration)
    setTimerActive(true)
  }

  // Stop the rest timer
  const stopTimer = () => {
    setTimerActive(false)
    releaseWakeLock()
  }

  // Reset the rest timer
  const resetTimer = () => {
    setTimerActive(false)
    setTimerSeconds(timerDuration)
    releaseWakeLock()
  }

  // Request wake lock to prevent screen from turning off
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch (error) {
      console.error('Wake lock request failed:', error)
    }
  }

  // Release wake lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }

  // Play timer completion sound
  const playTimerSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (error) {
      console.error('Error playing timer sound:', error)
    }
  }

  // Trigger device vibration
  const vibrateDevice = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]) // Pattern: vibrate-pause-vibrate
    }
  }

  // Progress specific exercise to next level (add reps)
  const progressExercise = (exerciseIndex: number) => {
    const updatedExercises = [...exercises]
    const exercise = updatedExercises[exerciseIndex]
    const newSets = [...exercise.sets]
    
    // Find the first set that can be increased (progression logic)
    for (let i = 0; i < newSets.length; i++) {
      // Check if we can add a rep to this set
      const currentMax = Math.max(...newSets)
      if (newSets[i] < currentMax) {
        newSets[i] += 1
        break
      } else if (i === 0) {
        // If first set is already at max, increase it
        newSets[i] += 1
        break
      }
    }
    
    // Update the specific exercise
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: newSets,
      currentSet: 0,
      completed: false
    }
    
    setExercises(updatedExercises)
    saveWorkoutData(updatedExercises)
    
    // Update workout complete status
    const allCompleted = updatedExercises.every(ex => ex.completed)
    setWorkoutComplete(allCompleted)
  }

  // Repeat specific exercise at same level
  const repeatExercise = (exerciseIndex: number) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      currentSet: 0,
      completed: false
    }
    
    setExercises(updatedExercises)
    saveWorkoutData(updatedExercises)
    
    // Update workout complete status
    const allCompleted = updatedExercises.every(ex => ex.completed)
    setWorkoutComplete(allCompleted)
  }



  // Reset workout to current progression level (not back to 1-1-1-1-1)
  const resetWorkout = () => {
    const resetExercises = exercises.map(exercise => ({
      ...exercise,
      currentSet: 0,
      completed: false
    }))
    
    setExercises(resetExercises)
    saveWorkoutData(resetExercises)
    setWorkoutComplete(false)
  }

  // Update exercise sets (for custom rep schemes)
  const updateExerciseSets = (exerciseIndex: number, newSets: number[]) => {
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: newSets,
      currentSet: 0,
      completed: false
    }
    
    setExercises(updatedExercises)
    saveWorkoutData(updatedExercises)
  }

  // Format timer display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize audio context on first user interaction
  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  return (
    <div className="min-h-screen bg-background p-4" onClick={initializeAudioContext}>
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-text-primary">Minimal Strength</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings size={24} />
        </button>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-6">
            {/* Timer Settings */}
            <div>
              <label className="block text-sm font-medium mb-2">Rest Timer (seconds)</label>
              <input
                type="number"
                value={timerDuration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value) || 60
                  setTimerDuration(newDuration)
                  setTimerSeconds(newDuration)
                }}
                className="w-full bg-surface-secondary text-text-primary px-3 py-2 rounded-lg border border-text-secondary focus:border-primary focus:outline-none"
                min="10"
                max="600"
              />
            </div>

            {/* Exercise Configuration */}
            <div>
              <h4 className="text-md font-medium mb-3">Exercise Configuration</h4>
              {exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.name} className="mb-4 p-3 bg-surface-secondary rounded-lg">
                  <label className="block text-sm font-medium mb-2">{exercise.name} Sets</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {exercise.sets.map((reps, setIndex) => (
                      <input
                        key={setIndex}
                        type="number"
                        value={reps}
                        onChange={(e) => {
                          const newReps = parseInt(e.target.value) || 1
                          const newSets = [...exercise.sets]
                          newSets[setIndex] = newReps
                          updateExerciseSets(exerciseIndex, newSets)
                        }}
                        className="bg-background text-text-primary px-2 py-1 rounded text-center border border-text-secondary focus:border-primary focus:outline-none"
                        min="1"
                        max="50"
                      />
                    ))}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Set {exercise.sets.length} sets with reps: {exercise.sets.join('-')}
                  </div>
                </div>
              ))}
            </div>

            {/* Reset Options */}
            <div>
              <h4 className="text-md font-medium mb-3">Reset Options</h4>
              <div className="space-y-2">
                <button
                  onClick={resetWorkout}
                  className="btn-secondary w-full"
                >
                  Reset Current Workout
                </button>
                <button
                  onClick={initializeDefaultWorkout}
                  className="btn-secondary w-full text-warning"
                >
                  Reset to 1-1-1-1-1 (Start Over)
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                &ldquo;Reset Current Workout&rdquo; keeps your progression. &ldquo;Start Over&rdquo; goes back to 1 rep per set.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timer Section */}
      <div className="card mb-6 text-center">
        <h2 className="text-lg font-semibold mb-4">Rest Timer</h2>
        <div className={`timer-display mb-4 ${timerActive ? 'animate-timer-pulse' : ''}`}>
          {formatTime(timerSeconds)}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={timerActive ? stopTimer : startTimer}
            className="btn-primary flex items-center gap-2"
          >
            {timerActive ? <Pause size={20} /> : <Play size={20} />}
            {timerActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4 mb-6">
        {exercises.map((exercise, exerciseIndex) => (
          <div key={exercise.name} className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="exercise-title">{exercise.name}</h3>
              {exercise.completed && (
                <CheckCircle className="text-success animate-bounce-in" size={24} />
              )}
            </div>
            
            {/* Sets display */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {exercise.sets.map((reps, setIndex) => (
                <div
                  key={setIndex}
                  className={`
                    p-3 rounded-lg text-center border-2 transition-all
                    ${setIndex < exercise.currentSet 
                      ? 'bg-success border-success text-white' 
                      : setIndex === exercise.currentSet && !exercise.completed
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface-secondary border-text-secondary text-text-secondary'
                    }
                  `}
                >
                  <div className="text-sm font-medium">Set {setIndex + 1}</div>
                  <div className="set-counter">{reps}</div>
                </div>
              ))}
            </div>

            {/* Exercise controls */}
            {!exercise.completed ? (
              <div className="text-center">
                <div className="text-sm text-text-secondary mb-2">
                  Current Set: {exercise.currentSet + 1} of {exercise.sets.length}
                </div>
                <div className="text-lg font-semibold mb-4">
                  Target Reps: {exercise.sets[exercise.currentSet]}
                </div>
                <button
                  onClick={() => completeSet(exerciseIndex)}
                  className="btn-success flex items-center gap-2 mx-auto"
                >
                  <CheckCircle size={20} />
                  Complete Set
                </button>
              </div>
            ) : (
              /* Exercise progression options */
              <div className="text-center">
                <div className="text-sm text-success mb-4 font-medium">
                  ✓ {exercise.name} Complete!
                </div>
                <div className="text-xs text-text-secondary mb-4">
                  Current: {exercise.sets.join('-')} | Next: {(() => {
                    const newSets = [...exercise.sets]
                    for (let i = 0; i < newSets.length; i++) {
                      const currentMax = Math.max(...newSets)
                      if (newSets[i] < currentMax) {
                        newSets[i] += 1
                        break
                      } else if (i === 0) {
                        newSets[i] += 1
                        break
                      }
                    }
                    return newSets.join('-')
                  })()}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => repeatExercise(exerciseIndex)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Same Level
                  </button>
                  <button
                    onClick={() => progressExercise(exerciseIndex)}
                    className="btn-success flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Workout Complete Message */}
      {workoutComplete && (
        <div className="card mb-6 text-center bg-success bg-opacity-10 border border-success">
          <h2 className="text-lg font-bold text-success mb-2">🎉 Full Workout Complete!</h2>
          <p className="text-text-secondary text-sm">
            Great job! You can progress each exercise individually above, or start a new workout.
          </p>
        </div>
      )}

      {/* Reset workout button (quick access) */}
      <div className="text-center">
        <button
          onClick={resetWorkout}
          className="text-text-secondary text-sm underline"
        >
          Reset Current Workout
        </button>
      </div>
    </div>
  )
} 