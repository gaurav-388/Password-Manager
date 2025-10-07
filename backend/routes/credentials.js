const router = require('express').Router();
const Credential = require('../models/credential.js');
const auth = require('../middleware/auth'); // We will create this middleware next

// @route   GET api/credentials
// @desc    Get all credentials for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const credentials = await Credential.find({ userId: req.user.id });
    res.json(credentials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/credentials
// @desc    Add a new credential
// @access  Private
router.post('/', auth, async (req, res) => {
  const { website, username, encryptedPassword, iv } = req.body;

  try {
    const newCredential = new Credential({
      userId: req.user.id,
      website,
      username,
      encryptedPassword,
      iv,
    });

    const credential = await newCredential.save();
    res.json(credential);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/credentials/:id
// @desc    Update a credential
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { website, username, encryptedPassword, iv } = req.body;

  // Build credential object
  const credentialFields = {};
  if (website) credentialFields.website = website;
  if (username) credentialFields.username = username;
  if (encryptedPassword) credentialFields.encryptedPassword = encryptedPassword;
  if (iv) credentialFields.iv = iv;

  try {
    let credential = await Credential.findById(req.params.id);

    if (!credential) return res.status(404).json({ msg: 'Credential not found' });

    // Make sure user owns credential
    if (credential.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    credential = await Credential.findByIdAndUpdate(
      req.params.id,
      { $set: credentialFields },
      { new: true }
    );

    res.json(credential);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/credentials/:id
// @desc    Delete a credential
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let credential = await Credential.findById(req.params.id);

    if (!credential) return res.status(404).json({ msg: 'Credential not found' });

    // Make sure user owns credential
    if (credential.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Credential.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Credential removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;