var Schema = mongoose.Schema;

var user = new Schema({
    username: String,
    password: String,
    email: String
});

var User = mongoose.model('User', user);
