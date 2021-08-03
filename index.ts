import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost:27017/forum', {useNewUrlParser: true, useUnifiedTopology: true})


interface UserType {
    name: string;
    created_at: Date;
}

const UserSchema = new mongoose.Schema<UserType>({
    name: {type: String, required: true},
    age: Number,
    created_at: {type: Date, default: Date.now},
})
const UserModel = mongoose.model<UserType>('user', UserSchema)

interface AnswerType {
    author: string;
    text: string;
    created_at: Date;
}

const AnswerSchema = new mongoose.Schema<AnswerType>({
    author: {type: mongoose.Types.ObjectId, ref: 'user', required: true},
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

const setUpTestDbCollection = async () => {

    const user1 = new UserModel({name: 'Doni', age: 23})
    const user2 = new UserModel({name: 'Mark', age: 25})

    await user1.save()
    await user2.save()

    const question1 = new QuestionModel({author: user1, text: 'what is weather?'})
    const question2 = new QuestionModel({author: user2, text: 'where is london?'})

    const answer1 = new AnswerModel({author: user2, text: 'weather is good'})
    const answer2 = new AnswerModel({author: user1, text: 'London is in England'})
    const answer22 = new AnswerModel({author: user1, text: 'but I`m not sure!'})

    question1.answers.push(answer1)
    question2.answers.push(answer2)
    question2.answers.push(answer22)

    await question1.save()
    await question2.save()
}

const removeTestDbCollection = async () => {
    await UserModel.collection.drop()
    await QuestionModel.collection.drop()
}

const rewriteTestCollection=async ()=>{
    await removeTestDbCollection()
    await setUpTestDbCollection()
}

rewriteTestCollection()

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

    //
    // const result = await QuestionModel.aggregate([
    //     {$unwind: '$answers'},
    //     {$replaceRoot: {newRoot: '$answers'}},
    //     {
    //         $group: {
    //             _id: {text: '$text'},
    //             count: {$sum: 1},
    //         }
    //     },
    //     {$set: {'_id.count': '$count'}},
    //     {$replaceRoot: {newRoot: '$_id'}},
    //     {$sort: {'count': SORT_TYPE.DEC}},
    //     {$limit: 1}
    // ]).exec()
    // console.log(first(result), 'result')
}

// find()


/*
* check-tests keys for learn aggregation pipeline
*
* 1) find all selected user answers
* 2) find all user answers questions
* 3) find last user answer
* 4) find last user question
* 5) find all answers exclude selected user answers
* 6) find all questions exclude selected user questions
* 7) find top more active answers users
* 8) find top  more active questions users
*
* * */

