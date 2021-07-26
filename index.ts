import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost:27017/forum', {useNewUrlParser: true, useUnifiedTopology: true})


interface UserType {
    name: string;
    created_at: Date;
}

const UserSchema = new mongoose.Schema<UserType>({
    name: String,
    created_at: {type: Date, default: Date.now},
})
const UserModel = mongoose.model<UserType>('user', UserSchema)

interface AnswerType {
    author: string;
    text: string;
    created_at: Date;
}

const AnswerSchema = new mongoose.Schema<AnswerType>({
    author: {type: mongoose.Types.ObjectId, ref: 'user'},
    text: {type: String, default: ''},
    created_at: {type: Date, default: Date.now}
})
const AnswerModel = mongoose.model<AnswerType>('answer', AnswerSchema)

interface QuestionType {
    author: string | UserType;
    text: string;
    answers: AnswerType[];
    created_at: Date;
}

const QuestionSchema = new mongoose.Schema<QuestionType>({
    author: {type: mongoose.Types.ObjectId, ref: 'user'},
    text: String,
    answers: [AnswerSchema],
    created_at: {type: Date, default: Date.now}
})
const QuestionModel = mongoose.model<QuestionType>('question', QuestionSchema)

const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('connection open!')
})

// const user = new UserModel({name: 'Mike'})
// user.save()
// const question = new QuestionModel({author: user, text: 'what is your name?'})
// question.save()

const SORT_TYPE = {
    INC: 1,
    DEC: -1,
}

const find = async () => {

    // const questions = await QuestionModel.find().exec()
    // const users = await UserModel.find().exec()
    // console.log(questions, 'questions')
    // console.log(users, 'users')
    // const result = await QuestionModel.find().populate('author').exec()
    // console.log(result, 'result')

    // const answer = new AnswerModel({text: 'today'})
    //
    // const question = await QuestionModel.findOne().exec()
    // question.answers.push(answer)
    // await question.save()
    // console.log(question, 'question')

    // const result = await QuestionModel.findOne().populate('author').exec()
    // const author = result.author as UserType
    const result = await QuestionModel.aggregate([
        {$unwind: '$answers'},
        {
            $group: {
                _id: {text: '$answers.text', created_at: '$answers.created_at'},
                count: {$sum: 1},
            }
        },
        {$replaceRoot: {newRoot: '$_id'}},
        {$sort: {'created_at': SORT_TYPE.INC}}
    ]).exec()
    console.log(result, 'result')
}

find()
