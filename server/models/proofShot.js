const mongoose = require('mongoose');
const proofShotSchema = new mongoose.Schema(
    {
        challengeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        imgUrl: {
            type: String,
            required: true,
        },
        comment: {
            type: String,
            required: true,
        },
        challengeTitle: {
            type: String,
            required: true,
        },
    },
    { timestamps: true } // createdAt, updatedAt 으로 Date형 객체 입력)
);

// 버츄얼 필드
proofShotSchema.virtual('proofShotId').get(function () {
    return this._id.toHexString();
});
proofShotSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model('ProofShot', proofShotSchema);
