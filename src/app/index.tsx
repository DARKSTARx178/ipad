import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, TouchableOpacity, ScrollView, TextInput } from 'react-native';

interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Clock State
  const [time, setTime] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('LOADING...');

  // Whiteboard State
  const [notes, setNotes] = useState<StickyNote[]>([
    { id: '1', text: 'Tap to edit notes', x: 30, y: 40, color: '#fef08a' },
    { id: '2', text: 'Drag me around!', x: 190, y: 120, color: '#bfdbfe' }
  ]);

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, '0');
      let minutes = now.getMinutes().toString().padStart(2, '0');
      let seconds = now.getSeconds().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
      setDateStr(now.toLocaleDateString('en-US', options));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Add Note Handler
  const addNote = () => {
    const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];
    const newNote: StickyNote = {
      id: Date.now().toString(),
      text: 'New note...',
      x: 50,
      y: 50,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setNotes([...notes, newNote]);
  };

  // Legacy Web Touch Drag Logic (Bypasses buggy PanResponder on old Safari)
  const handleTouchMove = (id: string, e: any) => {
    // Read raw client touches from web event layer
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent.changedTouches?.[0];
    if (!touch) return;

    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id
          ? { ...note, x: touch.clientX - 70, y: touch.clientY - 120 } // Center adjustment for note frame offset
          : note
      )
    );
  };

  // LANDSCAPE CLOCK COMPONENT
  if (isLandscape) {
    return (
      <View style={[styles.container, styles.landscapeBg]}>
        <Text style={styles.timeText}>{time}</Text>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>
    );
  }

  // PORTRAIT WHITEBOARD COMPONENT
  return (
    <View style={[styles.container, styles.portraitBg]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workspace Board</Text>
        <TouchableOpacity style={styles.button} onPress={addNote}>
          <Text style={styles.buttonText}>+ Add Note</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.canvas}>
        {notes.map(note => (
          <View
            key={note.id}
            style={[styles.stickyNote, { left: note.x, top: note.y, backgroundColor: note.color }]}
            onTouchMove={(e) => handleTouchMove(note.id, e)}
          >
            <TextInput
              style={styles.noteInput}
              multiline
              value={note.text}
              onChangeText={(text) => {
                setNotes(notes.map(n => n.id === note.id ? { ...n, text } : n));
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  landscapeBg: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  timeText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  dateText: {
    fontSize: 24,
    color: '#94a3b8',
    marginTop: 10,
    letterSpacing: 2,
  },
  portraitBg: {
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 70,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  stickyNote: {
    position: 'absolute',
    width: 140,
    height: 140,
    padding: 10,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    color: '#713f12',
    textAlignVertical: 'top',
  },
});
