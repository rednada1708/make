const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        startAt: {
            type: Date,
            required: true,
        },
        howtoContent: {
            type: String,
            required: true,
        },
        participants: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
        },
    },

    { timestamps: true } // createdAt, updatedAt 으로 Date형 객체 입력
);

ChallengeSchema.virtual('challengeId').get(function () {
    return this._id.toHexString();
});

ChallengeSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model('Challenges', ChallengeSchema);
