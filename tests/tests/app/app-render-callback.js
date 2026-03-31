// must support app.render() with callback to render views without sending to client

const express = require("express");

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'tests/parts');
app.set('env', 'production');

// Set app.locals for testing - include all required template variables
app.locals.title = 'App Title';
app.locals.message = 'App Message';
app.locals.asdf = 'app locals value';

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // Test 1: app.render() with callback using app.locals only
    app.render('index', (err, html) => {
        if (err) {
            console.log('Error:', err.message);
        } else {
            console.log('Render success:', typeof html === 'string');
            console.log('HTML is not empty:', html.length > 0);
            console.log('Contains app.locals title:', html.includes('App Title'));
            console.log('Contains app.locals message:', html.includes('App Message'));
            console.log('Contains app.locals asdf:', html.includes('app locals value'));
        }

        // Test 2: app.render() with local variables (no conflict with app.locals)
        app.render('index', { title: 'Custom Title', message: 'Custom Message', asdf: 'custom asdf' }, (err, html) => {
            if (err) {
                console.log('Error with locals:', err.message);
            } else {
                console.log('Render with locals success:', typeof html === 'string');
                console.log('HTML contains doctype:', html.includes('<!DOCTYPE html>'));
            }

            // Test 3: app.render() with non-existent view (error handling)
            app.render('non-existent-view', (err, html) => {
                console.log('Non-existent view error:', err !== null);
                console.log('Error has message:', typeof err?.message === 'string');
                console.log('HTML is undefined on error:', html === undefined);

                // Test 4: app.render() with empty options object
                app.render('index', {}, (err, html) => {
                    if (err) {
                        console.log('Empty options error:', err.message);
                    } else {
                        console.log('Render with empty options success:', typeof html === 'string');
                        console.log('Uses app.locals with empty options:', html.includes('App Title'));
                    }

                    process.exit(0);
                });
            });
        });
    });
});
