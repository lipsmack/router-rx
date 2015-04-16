import { jsdom } from "jsdom";
import { Observable, Scheduler, Subject } from "rx";
import { getURLPath, observeHashChange, createRouter } from "../src";

global.window = jsdom("<html><body></body></html>").defaultView;
global.document = window.document;
global.location = window.location;

var partial = function(obj, method, ...args) {
    return obj[method].bind(obj, ...args);
};

export default {
    tearDown(next) {
        location.hash = "";
        next();
    },

    testGetURLPath(test) {
        location.hash = "#!/foo/123";
        test.equal(getURLPath(), "/foo/123");

        location.hash = "#//bar/123";
        test.equal(getURLPath(), "/bar/123");

        location.hash = "/baz/123";
        test.equal(getURLPath(), "/baz/123");

        location.hash = "#quux/123";
        test.equal(getURLPath(), "/quux/123");

        location.hash = "blah/123";
        test.equal(getURLPath(), "/blah/123");

        test.done();
    },

    testObserveHashChange(test) {
        var expected = [
            "/",
            "/foo/123",
            "/bar/123"
        ];

        Observable.from(expected.slice(1))
            .observeOn(Scheduler.timeout)
            .forEach(path => location.hash = path);

        observeHashChange()
            .take(3)
            .doOnCompleted(() => test.done())
            .forEach(path => test.equal(path, expected.shift()));
    },

    testCreateRouter(test) {
        var spy = new Subject();

        spy.take(3).subscribeOnCompleted(
            () => {
                router.dispose();
                test.done();
            }
        );

        var router = createRouter({
            "/": partial(spy, "onNext"),
            "/foo/123": partial(spy, "onNext"),
            "/bar/123": partial(spy, "onNext")
        });

        var paths = [
            "/foo/123",
            "/bar/123"
        ];

        Observable.from(paths)
            .observeOn(Scheduler.timeout)
            .forEach(path => location.hash = path);
    }
};