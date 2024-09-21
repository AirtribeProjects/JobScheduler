const { default: mongoose } = require("mongoose");

const LogsSchema = new mongoose.Schema({
    job_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Job',required: true},
    timestamp: { type: Date, default: Date.now },
    status: { type: String, required: true },
    message: { type: String },
    error: { type: String }
});

module.exports = mongoose.model('Logs', LogsSchema);
