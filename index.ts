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

const sleep = async (time = 500) => await new Promise((ok) => setTimeout(ok, time))

const setUpTestDbCollection = async () => {

    const user1 = new UserModel({name: 'Donni', age: 23})
    await sleep()
    const user2 = new UserModel({name: 'Mark', age: 25})

    await user1.save()
    await sleep()
    await user2.save()

    const question1 = new QuestionModel({author: user1, text: 'what is weather?'})
    const question2 = new QuestionModel({author: user2, text: 'where is london?'})

    const answer1 = new AnswerModel({author: user2, text: 'weather is good'})
    await sleep()
    const answer2 = new AnswerModel({author: user1, text: 'London is in England'})
    const answer22 = new AnswerModel({author: user1, text: 'but I`m not sure!'})

    question1.answers.push(answer1)
    question2.answers.push(answer2)
    question2.answers.push(answer22)

    await question1.save()
    await sleep()
    await question2.save()
}

const removeTestDbCollection = async () => {
    await UserModel.collection.drop()
    await QuestionModel.collection.drop()
}

const rewriteTestCollection = async () => {
    await removeTestDbCollection()
    await setUpTestDbCollection()
}

// rewriteTestCollection()

const SORT_TYPE = {
    INC: 1,
    DEC: -1,
}


/*
* check-tests keys for learn aggregation pipeline
*
* 1) find all selected user answers
* 2) find all user answers questions
* 3) find last user answer
* 4) find last user question
* 5) find all answers exclude selected user answers
* 6) find all questions exclude selected user questions
* 7) find top count active answers users
* 8) find top count active questions users
*
* * */

const indent = '\n\n\n\n'

const find = async () => {

    const getOneUser = async (): Promise<{ _id: string, name: string }> => {
        const user: any = await UserModel.findOne().select(['name', '_id']).exec()
        console.log('data for user', user)
        return !!user ? user : {_id: '', name: ''}
    }

    const {_id} = await getOneUser()


    /*1*/
    const answers = await QuestionModel.aggregate([
        {$unwind: '$answers'},
        {$replaceRoot: {newRoot: '$answers'}},
        {$match: {author: _id}},
    ]).exec()
    console.log('1', answers, indent)

    /*2*/
    const questions2 = await QuestionModel.find({author: _id}).populate('author').exec()
    console.log('2', questions2, indent)

    /*3*/
    const answers3 = await QuestionModel.aggregate([
        {$unwind: '$answers'},
        {$replaceRoot: {newRoot: '$answers'}},
        {$sort: {created_at: SORT_TYPE.DEC}},
        {$limit: 1},
        {
            $lookup: {
                from: 'users',//collection name
                localField: 'author',//local key (user id)
                foreignField: '_id',//foreign user key (user id) one to one
                as: 'author' //new param name
            }
        },
        // take only user
        // {$unwind: '$author'},
        // {$replaceRoot: {newRoot: '$author'}},
    ]).exec()
    const answer3 = answers3[0]
    console.log('3', answer3, indent)

    /*4*/
    const questions4 = await QuestionModel.find().sort('-created_at').limit(1).exec()
    const question3 = questions4[0]
    console.log('4', question3, indent)


    /*5*/
    const answers5 = await QuestionModel.aggregate([
        {$unwind: '$answers'},
        {$replaceRoot: {newRoot: '$answers'}},
        {$match: {author: {$ne: _id}}},
    ]).exec()
    console.log('5', answers5, indent)

    /*6*/
    const questions6 = await QuestionModel.find({author: {$ne: _id}}).exec()
    console.log('6', questions6, indent)

    /*7*/
    const users7 = await QuestionModel.aggregate([
        {$unwind: '$answers'},
        {$replaceRoot: {newRoot: '$answers'}},
        {
            $group: {
                _id: {author: '$author'},
                count: {$sum: 1}
            }
        },
        {$sort: {count: -1}},
        {$replaceRoot: {newRoot: '$_id'}},
        {$limit: 1}
    ])
    const user7 = users7[0]
    console.log('7', user7, indent)

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

find()

