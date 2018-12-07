/* Include the required headers from httpd */
#include "httpd.h"
#include "http_core.h"
#include "http_protocol.h"
#include "http_request.h"
#include "util_md5.h"
#include "apr_sha1.h"

/* Define prototypes of our functions in this module */
static void register_hooks(apr_pool_t *pool);
static int example_handler(request_rec *r);
char* apr_pstrdup(apr_pool_t * p, const char * s);
void ap_args_to_table(request_rec * t, apr_table_t ** table);

/* Define our module as an entity and assign a function for registering hooks  */

module AP_MODULE_DECLARE_DATA example_module = {
    STANDARD20_MODULE_STUFF,
    NULL,            // Per-directory configuration handler
    NULL,            // Merge handler for per-directory configurations
    NULL,            // Per-server configuration handler
    NULL,            // Merge handler for per-server configurations
    NULL,            // Any directives we may have for httpd
    register_hooks   // Our hook registering function
};

/* register_hooks: Adds a hook to the httpd process */
static void register_hooks(apr_pool_t *pool) {
    /* Hook the request handler */
    ap_hook_handler(example_handler, NULL, NULL, APR_HOOK_LAST);
}

/* The handler function for our module.
 * This is where all the fun happens!
 */
static int example_handler(request_rec *r)
{
    /* First off, we need to check if this is a call for the "example" handler.
     * If it is, we accept it and do our things, it not, we simply return DECLINED,
     * and Apache will try somewhere else.
     */
    if (!r->handler || strcmp(r->handler, "example-handler")) return (DECLINED);

    ap_set_content_type(r, "text/html");
    ap_rprintf(r, "<h2>Hello, %s!</h2>", r->useragent_ip);
    ap_rprintf(r, "<h2>You used %s method.</h2>", r->method);
    ap_rprintf(r, "<h2>Your query string is: %s.</h2>", r->args);
    ap_rprintf(r, "<h2>Your requested filename is: %s.</h2>", r->filename);

    /* Example1. Work out the digest of the file */
    char *filename = apr_pstrdup(r->pool, r->filename); // Figure out which file is being requested by removing the .sum from it.
    filename[strlen(filename) - 4] = 0; // Cut off the last 4 characters.
    apr_finfo_t finfo; // The file information structure.
    int rc = apr_stat(&finfo, filename, APR_FINFO_MIN, r->pool); // Figure out if the file we request a sum on exists and isn't a directory.
    if (rc == APR_SUCCESS) {
        int exists = ((finfo.filetype != APR_NOFILE) && !(finfo.filetype & APR_DIR));
        if (!exists) {
            ap_rputs("<b>Your requested file not found.</b>", r);
            return OK;
        }
        ap_rprintf(r, "<h2>Information on %s:</h2>", filename);
        ap_rprintf(r, "<b>Size:</b> %lu bytes<br/>", (unsigned long) finfo.size);
    } else {
        ap_rputs("<b>Your requests is forbidden.</b>", r);
        return OK;
    } // Figure out if the file we request a sum on exists and isn't a directory.

    apr_table_t *GET; // The table abstract datatype.
    ap_args_to_table(r, &GET); // Parse query args for the request and store in new table allocated from the request pool.
    apr_array_header_t *POST; // An opaque array type.
    ap_parse_form_data(r, NULL, &POST, -1,  8192); // Read the body and parse any form found, which must be of the type application/x-www-form-urlencoded.
    const char *digestType = apr_table_get(GET, "digest"); // Get digest key value
    if (!digestType) digestType = "MD5"; // Default digest is MD5
    apr_file_t *file;
    rc = apr_file_open(&file, filename, APR_READ, APR_OS_DEFAULT, r->pool);
    if (rc == APR_SUCCESS) {
        if  (!strcasecmp(digestType, "md5")) { // Compare ignore the case
            union {
                unsigned char chr[16];
                uint32_t num[4];
            } digest;
            apr_md5_ctx_t md5; // MD5 Context
            apr_md5_init(&md5); // init MD5 algorithm
            apr_size_t readBytes = 256; // read bytes one time
            char buffer[256];
            while (apr_file_read(file, buffer, &readBytes) == APR_SUCCESS) {
                apr_md5_update(&md5, buffer, readBytes);
            }
            apr_md5_final(digest.chr, &md5);
            ap_rputs("<b>MD5: </b><code>", r);
            for (int n = 0; n < APR_MD5_DIGESTSIZE / 4; n++) {
                ap_rprintf(r, "%08x", digest.num[n]);
            }
            ap_rputs("</code>", r);
            ap_rputs("<br/><a href='?digest=sha1'>View the SHA1 hash instead</a>", r);
        } else {
            union {
                unsigned char chr[20];
                uint32_t num[5];
            } digest;
            apr_sha1_ctx_t sha1;
            apr_sha1_init(&sha1);
            apr_size_t readBytes = 256; // read bytes one time
            char buffer[256];
            while (apr_file_read(file, buffer, &readBytes) == APR_SUCCESS) {
                apr_sha1_update(&sha1, buffer, readBytes);
            }
            apr_sha1_final(digest.chr, &sha1);
            ap_rputs("<b>SHA1: </b><code>", r);
            for (int n = 0; n < APR_SHA1_DIGESTSIZE / 4; n++) {
                ap_rprintf(r, "%08x", digest.num[n]);
            }
            ap_rputs("</code>", r);
            ap_rputs("<br/><a href='?digest=md5'>View the MD5 hash instead</a>", r);
        }
    }
    apr_file_close(file);

    /* Example2. Hard-coded configuration */

    return OK;
}
