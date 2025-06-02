const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
fs.ensureDirSync(dataDir);

// Path to journal entries file
const journalFilePath = path.join(dataDir, 'journal-entries.json');

// Initialize journal file if it doesn't exist
if (!fs.existsSync(journalFilePath)) {
  fs.writeJSONSync(journalFilePath, { entries: [] });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function to read journal entries
const readJournalEntries = () => {
  try {
    return fs.readJSONSync(journalFilePath);
  } catch (error) {
    console.error('Error reading journal entries:', error);
    return { entries: [] };
  }
};

// Helper function to write journal entries
const writeJournalEntries = (data) => {
  try {
    fs.writeJSONSync(journalFilePath, data);
    return true;
  } catch (error) {
    console.error('Error writing journal entries:', error);
    return false;
  }
};

// Routes

// Get all journal entries
app.get('/api/entries', (req, res) => {
  const journalData = readJournalEntries();
  res.json(journalData.entries);
});

// Add a new journal entry
app.post('/api/entries', (req, res) => {
  const { text, date } = req.body;
  
  if (!text || !date) {
    return res.status(400).json({ error: 'Text and date are required' });
  }
  
  const journalData = readJournalEntries();
  
  const newEntry = {
    id: Date.now().toString(),
    text,
    date,
    createdAt: new Date().toISOString()
  };
  
  journalData.entries.unshift(newEntry);
  
  if (writeJournalEntries(journalData)) {
    res.status(201).json(newEntry);
  } else {
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

// Delete a journal entry
app.delete('/api/entries/:id', (req, res) => {
  const { id } = req.params;
  
  const journalData = readJournalEntries();
  const entryIndex = journalData.entries.findIndex(entry => entry.id === id);
  
  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  
  journalData.entries.splice(entryIndex, 1);
  
  if (writeJournalEntries(journalData)) {
    res.json({ message: 'Entry deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// Update a journal entry
app.put('/api/entries/:id', (req, res) => {
  const { id } = req.params;
  const { text, date } = req.body;
  
  if (!text && !date) {
    return res.status(400).json({ error: 'Text or date is required for update' });
  }
  
  const journalData = readJournalEntries();
  const entryIndex = journalData.entries.findIndex(entry => entry.id === id);
  
  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  
  // Update only the provided fields
  if (text) journalData.entries[entryIndex].text = text;
  if (date) journalData.entries[entryIndex].date = date;
  journalData.entries[entryIndex].updatedAt = new Date().toISOString();
  
  if (writeJournalEntries(journalData)) {
    res.json(journalData.entries[entryIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
