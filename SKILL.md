---
name: whmcs-addon-module
description: >
  Scaffold and extend general-purpose WHMCS addon modules. Covers the entry file
  (_config/_activate/_upgrade/_output/_clientarea), PSR-4 lib/ with Module
  singleton + Admin/Client dispatchers and services, Eloquent models, Monolog
  logging, optional standalone JSON endpoints, optional HMAC webhooks, hooks.php
  patterns, and an optional Svelte+Vite admin SPA. Self-contained — do not read
  example addons to scaffold. Use when user says "create whmcs addon", "new
  whmcs module", "scaffold addon module", "whmcs addon", or works inside a WHMCS
  modules repo (addons/, gateways/, admin-ui/, push.sh/pull.sh layout).
---

# WHMCS Addon Module Architecture

Official docs: https://developers.whmcs.com/addon-modules/

This skill is **self-contained**. Scaffold from these patterns alone. Do not open
or copy from any example addon directory unless the user explicitly asks you to
match an existing module.

Placeholder `<Name>` = module name. Pick ONCE per project; it must be identical in:
directory name, core file name, function prefix, namespace, `Module::NAME`, and
config `name` key. WHMCS docs recommend all-lowercase (`my_module`); CamelCase
also works — stay consistent.

Also pick a short `<Prefix>` for session keys, CSRF headers, and postMessage
types (e.g. `MyAddon`). It may differ from `<Name>`; keep it consistent across
PHP and any SPA.

## Choosing what to include

Start minimal; add only what the feature needs:

| Need | Include |
|------|---------|
| Admin settings only | Entry `_config` + empty `_output` or simple HTML |
| Admin UI (classic) | `_output` → AdminDispatcher → Controller + Smarty/HTML |
| Admin UI (SPA) | iframe shell + `controllers/admin.php` + `AdminService` + `admin-ui/` |
| Client pages | `_clientarea` → ClientDispatcher → templates |
| Client AJAX POST | Module-root standalone endpoint (see Optional: client confirm) |
| Custom DB tables | `_activate` / `_deactivate` / `_upgrade` + Eloquent model |
| External HTTP API | `lib/Api.php` (Guzzle) |
| Inbound webhooks | `webhooks/*.php` (HMAC) |
| Background work | `hooks.php` + cron lock |
| Logging | `LoggerUtil` + `ContextProcessor` |

A typical admin CRUD addon needs: entry file, `Module`, Admin dispatcher/controller,
optional `AdminService` + JSON endpoint, optional SPA, hooks for assets, logging.
Payment gateways, webhooks, and multi-backend APIs are optional extras.

## Repo layout vs deployed layout (CRITICAL)

```
repo-root/
├── addons/<Name>/          # THE MODULE — the only thing that gets deployed
│   ├── <Name>.php          # entry file (required)
│   ├── hooks.php           # auto-loaded by WHMCS on every page
│   ├── utils.php           # procedural helpers (optional but common)
│   ├── confirm_action.php  # optional: standalone client/admin AJAX endpoint
│   ├── controllers/
│   │   ├── admin.php       # optional: standalone JSON API (admin)
│   │   └── client.php      # optional: standalone JSON API (client)
│   ├── lib/                # PSR-4 root: WHMCS\Module\Addon\<Name>\
│   │   ├── Module.php
│   │   ├── Api.php                 # optional
│   │   ├── LoggerUtil.php          # recommended
│   │   ├── ContextProcessor.php    # recommended with LoggerUtil
│   │   ├── Encrypter.php           # optional
│   │   ├── Pagination.php          # optional / legacy HTML admin
│   │   ├── MakesPagination.php     # optional / legacy HTML admin
│   │   ├── RendersMessages.php     # optional flash/toast helper
│   │   ├── Admin/AdminDispatcher.php, Controller.php, AdminService.php
│   │   ├── Client/ClientDispatcher.php, Controller.php   # if client area
│   │   └── <Model>.php             # Eloquent models as needed
│   ├── templates/*.tpl             # if client area / classic admin
│   ├── assets/                     # static assets + built SPA output
│   │   ├── app.js
│   │   ├── admin/                  # built SPA (vite outDir) — if SPA
│   │   └── client/<page>/...
│   └── webhooks/notifications.php  # optional inbound webhook
├── gateways/               # payment gateway modules (separate concern)
├── admin-ui/               # optional SPA source — NEVER deployed as source
├── composer.json/.lock     # IDE autocompletion ONLY — never uploaded
├── stubs.php               # IDE stubs for WHMCS classes — never uploaded
├── push.sh / pull.sh       # local rsync — NEVER uploaded, never referenced by code
└── .gitignore
```

**Deployed target:** server `/modules/addons/<Name>/`. Only files under `addons/<Name>/` go there.

**Never upload:** `push.sh`, `pull.sh`, `composer.json`, `composer.lock`, `stubs.php`,
`admin-ui/` source, `vendor/`, `node_modules/`, logs (`*.log`, `*_log`, `error_log`).

**init.php path depth** (from the PHP file being executed):
- Module root (`addons/<Name>/*.php`) → `../../../init.php`
- One level deeper (`controllers/`, `webhooks/`) → `../../../../init.php`

## Entry file: `addons/<Name>/<Name>.php`

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use WHMCS\Database\Capsule;
use WHMCS\Module\Addon\<Name>\Admin\AdminDispatcher;
use WHMCS\Module\Addon\<Name>\Client\ClientDispatcher; // omit if no client area
use WHMCS\Module\Addon\<Name>\Module;

if (!defined("WHMCS")) {
    die("This file cannot be accessed directly");
}

if (!defined("<PREFIX>_MODULE_DIR")) {
    define("<PREFIX>_MODULE_DIR", __DIR__);
}
if (!defined("<PREFIX>_MODULE_NAME")) {
    define("<PREFIX>_MODULE_NAME", '<Name>');
}

function <Name>_config()
{
    return [
        'name'        => 'Display Name',
        'description' => '',
        'author'      => 'Author',
        'language'    => 'english', // or 'spanish', etc.
        'version'     => '1.0',     // bump on every release that changes schema/behavior
        'fields' => [
            // Add only what this module needs. Common patterns:
            'api_url' => [
                'FriendlyName' => 'API URL',
                'Type'         => 'text', // text | password | yesno | textarea | dropdown | radio
                'Size'         => '128',
                'Default'      => '',
                'Description'  => '',
            ],
            'api_token' => [
                'FriendlyName' => 'API token',
                'Type'         => 'password',
                'Size'         => '128',
                'Default'      => '',
            ],
            'production' => [
                'FriendlyName' => 'Production mode',
                'Type'         => 'yesno',
                'Default'      => false,
            ],
            // Optional: webhook_secret, session TTLs, dropdown Options, admin allow-lists, etc.
        ],
    ];
}

function <Name>_activate()
{
    try {
        // Create EVERY table/column a fresh install needs.
        // Keep in sync with the final state of _upgrade() blocks.
        Capsule::schema()->dropIfExists('<prefix>_items');
        Capsule::schema()->create('<prefix>_items', function ($table) {
            /** @var Blueprint $table */
            $table->increments('id');
            $table->string('name', 255);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        return ['status' => 'success', 'description' => 'Module activated'];
    } catch (\Exception $e) {
        Capsule::schema()->dropIfExists('<prefix>_items');
        return ['status' => 'error', 'description' => 'Activation failed: ' . $e->getMessage()];
    }
}

function <Name>_deactivate()
{
    try {
        Capsule::schema()->dropIfExists('<prefix>_items');
        return ['status' => 'success', 'description' => 'Module deactivated'];
    } catch (\Exception $e) {
        return ['status' => 'error', 'description' => 'Deactivation failed: ' . $e->getMessage()];
    }
}

function <Name>_upgrade($vars)
{
    $currentlyInstalledVersion = $vars['version'];

    // APPEND ONLY. Never edit old blocks; each release adds one new block at the bottom.
    // Every column added here MUST also exist in _activate() for fresh installs.
    if ($currentlyInstalledVersion < '1.1') {
        Capsule::schema()->table('<prefix>_items', function (Blueprint $table) {
            $table->boolean('is_processed')->default(false);
        });
    }
}

function <Name>_output($vars)
{
    Module::instantiate($vars);

    $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

    $dispatcher = new AdminDispatcher();
    echo $dispatcher->dispatch($action, $vars);
}

function <Name>_clientarea($vars)
{
    // Omit this function entirely if the module has no client area.
    Module::instantiate($vars);

    $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

    return (new ClientDispatcher())->dispatch($action, $vars);
}
```

Optional: `<Name>_sidebar($vars)` returns sidebar HTML.

Field types: `text` (Size), `password`, `yesno`, `textarea` (Rows/Cols),
`dropdown` / `radio` (`Options` = array or comma-separated string). Values live in
`tbladdonmodules` and are read via the `Module` singleton.

## lib/Module.php — settings singleton + link builders

```php
<?php

namespace WHMCS\Module\Addon\<Name>;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use WHMCS\Database\Capsule;

require_once __DIR__ . '/../utils.php'; // if you have utils.php

/**
 * @property-read string $modulelink
 * @property-read string $version
 * @property-read string $_lang
 * @property-read string $api_url
 * @property-read bool   $production
 */
class Module
{
    const NAME = '<Name>';

    protected static ?Module $instance = null;
    protected array $settings;

    public static function get(): self
    {
        if (!isset(static::$instance)) {
            static::instantiate();
        }
        return static::$instance;
    }

    public static function dir(): string
    {
        return <PREFIX>_MODULE_DIR;
    }

    public static function instantiate($vars = [], $override = false): void
    {
        if (self::$instance && !$override) {
            return;
        }
        if (empty($vars)) {
            require_once __DIR__ . '/../<Name>.php';
            $vars = Capsule::table('tbladdonmodules')
                ->where('module', '=', self::NAME)
                ->pluck('value', 'setting')
                ->all();
        }
        self::$instance = new self($vars);
    }

    // Client-area URL: /index.php?m=<Name>&action=...
    public static function clientLink($action = null, $args = [], $doNotEncode = []): string
    {
        $args = Arr::dot($args);
        $args['m'] = self::NAME;
        $args['action'] = $action ?: 'index';

        $encoded = [];
        foreach ($args as $key => $value) {
            $encoded[] = urlencode($key) . '=' .
                (in_array($key, $doNotEncode) ? $value : urlencode($value));
        }
        return '/index.php?' . implode('&', $encoded);
    }

    // Admin-area URL: /admin/addonmodules.php?module=<Name>&action=...
    public static function adminLink($action = null, $args = []): string
    {
        $args = Arr::dot($args);
        $args['module'] = self::NAME;
        $args['action'] = $action ?: 'index';

        $encoded = [];
        foreach ($args as $key => $value) {
            $encoded[] = urlencode($key) . '=' . urlencode($value);
        }
        return '/admin/addonmodules.php?' . implode('&', $encoded);
    }

    // Optional: hidden inputs for classic admin forms
    public static function adminFormInputs($action = null, $args = []): string
    {
        $args = Arr::dot($args);
        $args['module'] = self::NAME;
        $args['action'] = $action ?: 'index';
        $html = '';
        foreach ($args as $key => $value) {
            $html .= '<input type="hidden" name="' . htmlspecialchars($key) . '" value="'
                . htmlspecialchars((string) $value) . '">';
        }
        return $html;
    }

    protected function __construct($settings)
    {
        $this->settings = $settings;
    }

    // Module::get()->apiUrl → settings['api_url']
    public function __get($name)
    {
        return data_get($this->settings, Str::snake($name), null);
    }
}
```

Put shared business logic on `Module` and/or dedicated Service classes. Use
`Capsule::table(...)` for WHMCS core tables and Eloquent models for module tables.

**Optional — multi-backend API:** if the module talks to more than one HTTP service,
expose `Module::api(string $type = 'default'): Api` that picks base URL/token from
the matching config fields. Keep `Api` as a thin Guzzle wrapper.

## lib/Admin/ — dispatcher, controller, service

```php
<?php

namespace WHMCS\Module\Addon\<Name>\Admin;

class AdminDispatcher
{
    public function dispatch($action, $parameters): string
    {
        if (!$action) {
            $action = 'index';
        }

        $controller = new Controller();

        if (is_callable([$controller, $action])) {
            return $controller->$action($parameters);
        }

        return '<p>Invalid action requested.</p>';
    }
}
```

Controller may render an SPA shell (iframe) **or** classic HTML. Both are valid.

```php
<?php

namespace WHMCS\Module\Addon\<Name>\Admin;

use Symfony\Component\HttpFoundation\Request;
use WHMCS\Module\Addon\<Name>\LoggerUtil;
use WHMCS\Module\Addon\<Name>\Module;
use WHMCS\Module\Addon\<Name>\RendersMessages;

class Controller
{
    use RendersMessages; // optional

    const ADMIN_APP_PATH = '/modules/addons/<Name>/assets/admin/index.html';
    const ADMIN_DEFAULT_VIEW = 'list'; // SPA default tab/view id

    public function index($vars)
    {
        try {
            // SPA path:
            return $this->renderAdminShell(self::ADMIN_DEFAULT_VIEW);
            // Classic path alternative: return HTML string / form markup
        } catch (\Throwable $th) {
            LoggerUtil::get()->error('Admin index error', ['ex' => $th]);
            return '<div class="alert alert-danger" role="alert">Internal error</div>';
        }
    }

    protected function adminAppUrl($view, $hash = null)
    {
        $suffix = "?view={$view}&v=" . $this->appVersion();
        return self::ADMIN_APP_PATH . $suffix . ($hash ? '#' . $hash : '');
    }

    protected function appVersion()
    {
        $built = __DIR__ . '/../../assets/admin/index.html';
        return file_exists($built) ? (string) filemtime($built) : '1';
    }

    protected function renderAdminShell($view, $hash = null)
    {
        $view ??= self::ADMIN_DEFAULT_VIEW;
        $hash = $_GET['view'] ?? null;

        return <<<HTML
    {$this->renderMessages()}
    <iframe src="{$this->adminAppUrl($view, $hash)}" id="<prefix>-admin-frame"
      style="width: 100%; border: 0; display: block; min-height: 480px;"></iframe>
    <script type="text/javascript">
      (function () {
        function resize(height) {
          var f = document.getElementById('<prefix>-admin-frame');
          if (f) f.style.height = height + 'px';
        }
        function pushHistory(view) {
          var query = new URLSearchParams(window.location.search);
          query.set('action', 'index');
          query.set('view', view);
          window.history.pushState({}, '', window.location.pathname + '?' + query.toString());
        }
        window.addEventListener('message', function (e) {
          if (!e || !e.data) return;
          if (e.data.type === '<Prefix>:height') resize(e.data.height);
          else if (e.data.type === '<Prefix>:navigation') pushHistory(e.data.view);
        });
      })();
    </script>
    HTML;
    }

    // Classic / dual-path: process POST → flash → redirect
    public function saveItem($vars)
    {
        try {
            $result = (new AdminService())->save($_POST);
            $_SESSION['<Prefix>.message'] = $result['message'];
        } catch (\Throwable $th) {
            LoggerUtil::get()->error('Error saving item', ['ex' => $th]);
            $_SESSION['<Prefix>.message'] = ['type' => 'error', 'text' => 'Unexpected error'];
        }
        header('Location: ' . $this->safeReferrer(Request::createFromGlobals()));
        exit;
    }

    // Same-host referrer only — prevents open redirects
    protected function safeReferrer(Request $request): string
    {
        $candidate = $request->request->get('_ref') ?: $request->headers->get('Referer');
        $fallback = Module::adminLink('index');
        if (!$candidate) {
            return $fallback;
        }
        $host = $request->getHost();
        $parts = parse_url($candidate);
        if (!empty($parts['host']) && strcasecmp($parts['host'], $host) !== 0) {
            return $fallback;
        }
        return $candidate;
    }
}
```

**AdminService** holds business logic shared by the HTML controller and
`controllers/admin.php`, so both paths stay in sync:

```php
<?php

namespace WHMCS\Module\Addon\<Name>\Admin;

use WHMCS\Module\Addon\<Name>\Item; // your Eloquent model

class AdminService
{
    public function bootstrap(): array
    {
        if (empty($_SESSION['<Prefix>.csrf'])) {
            $_SESSION['<Prefix>.csrf'] = bin2hex(random_bytes(32));
        }
        $flash = $_SESSION['<Prefix>.message'] ?? null;
        unset($_SESSION['<Prefix>.message']);

        return [
            'csrf'  => $_SESSION['<Prefix>.csrf'],
            'flash' => $flash,
            // plus any config the SPA needs (non-secret)
        ];
    }

    /** @return array{rows: array, meta: array{page:int,pageSize:int,total:int,lastPage:int,prevPage:int,nextPage:int}} */
    public function listItems($search = '', $page = 1, $pageSize = 20)
    {
        $query = Item::query();

        if ('' !== $search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $total = $query->count();
        $lastPage = max(1, (int) ceil($total / $pageSize));
        $page = max(1, min($page, $lastPage));
        $offset = ($page - 1) * $pageSize;

        $rows = $query->orderByDesc('id')->offset($offset)->limit($pageSize)->get()->all();

        return [
            'rows' => array_values(array_map([$this, 'presentRow'], $rows)),
            'meta' => [
                'page' => $page, 'pageSize' => $pageSize, 'total' => $total,
                'lastPage' => $lastPage,
                'prevPage' => $page > 1 ? $page - 1 : 0,
                'nextPage' => $page < $lastPage ? $page + 1 : 0,
            ],
        ];
    }

    public function save(array $input): array
    {
        // validate + persist; return ['success' => true, 'message' => [...]]
        return ['success' => true, 'message' => ['type' => 'success', 'text' => 'Saved']];
    }

    protected function presentRow($row): array
    {
        return [
            'id' => $row->id,
            'name' => $row->name,
            'is_active' => (bool) $row->is_active,
            // UI flags as needed: 'can_edit' => true, etc.
        ];
    }
}
```

## lib/Client/ — dispatcher + controller (optional)

```php
<?php

namespace WHMCS\Module\Addon\<Name>\Client;

use WHMCS\Module\Addon\<Name>\ContextProcessor;

class ClientDispatcher
{
    public function dispatch($action, $parameters): ?array
    {
        if (empty($action)) {
            $action = 'index';
        }

        $controller = new Controller();
        ContextProcessor::put('controller_action', $action);

        if (is_callable([$controller, $action])) {
            return $controller->$action($parameters);
        }
        return null;
    }
}
```

Client actions MUST return the WHMCS page array; `templatefile` is relative to the
module dir WITHOUT `.tpl`:

```php
public function index($vars): array
{
    Module::instantiate($vars);

    return [
        'pagetitle'    => 'Title',
        'breadcrumb'   => [$this->moduleLink() => 'Label'],
        'templatefile' => 'index',      // -> templates/index.tpl
        'requirelogin' => true,
        'forcessl'     => false,
        'vars'         => ['title' => '...', 'message' => '...'],
    ];
}

protected function moduleLink($action = null, $args = []): string
{
    $args['m'] = Module::NAME;
    $args['action'] = $action ?: 'index';
    return 'index.php?' . http_build_query($args);
}
```

Add more actions (`success`, `failure`, etc.) only when the flow needs them.
For return URLs that must not be forgeable, store a one-time opaque token on the
row and validate it in the action.

## Models (Eloquent over custom tables)

```php
<?php

namespace WHMCS\Module\Addon\<Name>;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $table = '<prefix>_items';

    protected $hidden = []; // put secrets here if any (tokens, etc.)

    protected $attributes = ['is_active' => true];

    protected $casts = [
        self::CREATED_AT => 'immutable_datetime',
        self::UPDATED_AT => 'immutable_datetime',
        'is_active'      => 'boolean',
    ];

    public function scopeActive(Builder $query)
    {
        return $query->where($this->qualifyColumn('is_active'), true);
    }
}
```

Concurrent-safe mutations:

```php
Capsule::connection()->beginTransaction();
try {
    $row = Item::where('id', $id)->lockForUpdate()->first();
    // mutate; early-exit if already in terminal state (idempotency)
    Capsule::connection()->commit();
} catch (\Throwable $e) {
    Capsule::connection()->rollBack();
    throw $e;
}
```

## Logging: lib/LoggerUtil.php + lib/ContextProcessor.php

```php
<?php

namespace WHMCS\Module\Addon\<Name>;

use Monolog\Handler\RotatingFileHandler;
use Monolog\Logger as MonologLogger;
use Monolog\Processor\UidProcessor;
use Monolog\Processor\WebProcessor;

class LoggerUtil
{
    protected static ?MonologLogger $logger = null;

    public static function get()
    {
        if (!isset(static::$logger)) {
            $file = Module::dir() . DIRECTORY_SEPARATOR . '<Prefix>.log';
            static::$logger = new MonologLogger('<Name>', [
                new RotatingFileHandler($file, 7, MonologLogger::INFO, true, 0666),
            ], [
                new UidProcessor(),
                new WebProcessor(),
                new ContextProcessor(),
            ]);
        }
        return static::$logger;
    }
}
```

```php
<?php

namespace WHMCS\Module\Addon\<Name>;

use Monolog\Processor\ProcessorInterface;

class ContextProcessor implements ProcessorInterface
{
    protected static array $context = [];

    public function __invoke(array $record)
    {
        $record['context'] = array_merge(static::$context, $record['context']);
        return $record;
    }

    public static function put($key, $value) { data_set(static::$context, $key, $value); }
    public static function set($merge = [], $replace = false)
    {
        static::$context = $replace ? $merge : array_merge(static::$context, $merge);
    }
    public static function get() { return static::$context; }
    public static function forget($key = null)
    {
        if ($key === null) {
            static::$context = [];
            return;
        }
        data_forget(static::$context, $key);
    }
    public function reset() { self::$context = []; }
}
```

Usage: `ContextProcessor::put('flow.key', $data)` anywhere in a request; later log
lines carry it automatically. Never log tokens, secrets, or raw webhook signatures.

## Optional: standalone JSON endpoint — `controllers/admin.php`

For SPA/API usage. Bootstraps WHMCS, authenticates admin, CSRF via header.

```php
<?php

define('WHMCS', true);
require_once __DIR__ . '/../../../../init.php';
require_once __DIR__ . '/../lib/Module.php';
require_once __DIR__ . '/../lib/LoggerUtil.php';
require_once __DIR__ . '/../lib/Admin/AdminService.php';

use WHMCS\Authentication\CurrentUser;
use WHMCS\Module\Addon\<Name>\Admin\AdminService;
use WHMCS\Module\Addon\<Name>\LoggerUtil;
use WHMCS\Module\Addon\<Name>\Module;

ob_start();

$status = 200;
$response = ['success' => false, 'message' => 'Internal server error'];

try {
    Module::instantiate();

    $currentUser = new CurrentUser();
    if (!$currentUser->admin()) {
        $status = 401;
        $response = ['success' => false, 'message' => 'Unauthorized.'];
        finish();
    }

    $service = new AdminService();
    $op = $_REQUEST['op'] ?? 'bootstrap';

    // CSRF: exempt bootstrap + safe read-only GET ops; require CSRF for all mutators
    $csrfExempt = ['bootstrap', 'list', 'get']; // adjust to your read ops
    if (!in_array($op, $csrfExempt, true) && !csrfValid()) {
        $status = 401;
        $response = ['success' => false, 'message' => 'Invalid CSRF token.'];
        finish();
    }

    if ('bootstrap' === $op) {
        $response = array_merge(['success' => true], $service->bootstrap());
        finish();
    }

    switch ($op) {
        case 'list':
            $response = array_merge(['success' => true], $service->listItems(
                trim((string) ($_GET['query'] ?? '')),
                max(1, (int) ($_GET['page'] ?? 1)),
                min(100, max(1, (int) ($_GET['pageSize'] ?? 20)))
            ));
            break;
        case 'save':
            $response = $service->save(jsonBody());
            break;
        // add delete / custom mutators as needed
        default:
            $status = 400;
            $response = ['success' => false, 'message' => 'Unknown operation.'];
    }
} catch (\Throwable $th) {
    LoggerUtil::get()->error('Admin API error', ['ex' => $th]);
    $status = 500;
    $response = ['success' => false, 'message' => 'Unexpected server error.'];
}

function finish()
{
    global $status, $response;
    http_response_code($status);
    ob_end_clean();
    header('Content-Type: application/json');
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function csrfValid()
{
    $expected = $_SESSION['<Prefix>.csrf'] ?? '';
    if ('' === $expected) {
        return false;
    }
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $provided = $headers['X-<Prefix>-CSRF'] ?? ($_SERVER['HTTP_X_<UPPERPREFIX>_CSRF'] ?? '');
    return hash_equals((string) $expected, (string) $provided);
}

function jsonBody()
{
    $data = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($data) ? $data : [];
}

finish();
```

`bootstrap` creates and returns the CSRF token. Mutating ops never skip CSRF.

## Optional: client AJAX confirm / action endpoint

When a client Smarty page needs `fetch()` without a full `_clientarea` round-trip,
add a **module-root** standalone script (e.g. `confirm_action.php`):

1. Boot WHMCS (`../../../init.php` from module root).
2. Authenticate with `CurrentUser` (usually `->client()`).
3. Validate input (Illuminate Validation is available in WHMCS).
4. Run the action; return JSON (`JsonResponse` or `echo json_encode`).
5. Point the form/JS at `/modules/addons/<Name>/confirm_action.php`.

Treat it like any other URL-reachable endpoint: auth, validation, generic errors,
no secrets in the response. Stash request context in `$_SESSION['<Prefix>.*']`
when the previous page collected it.

## Optional: webhook endpoint — `webhooks/notifications.php`

Standalone, HMAC-SHA256 signed, no session. Use only when an external system
pushes events.

```php
<?php

define('WHMCS', true);
require_once __DIR__ . '/../../../../init.php';
require_once __DIR__ . '/../lib/Module.php';
require_once __DIR__ . '/../lib/LoggerUtil.php';

use WHMCS\Module\Addon\<Name>\LoggerUtil;
use WHMCS\Module\Addon\<Name>\Module;

try {
    Module::instantiate();

    $headers = getallheaders();
    // Header name is provider-specific — configure it; do not hard-code a vendor name
    $signature = $headers['x-webhook-signature'] ?? null;
    $payload = file_get_contents('php://input');

    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? null;
    if ($contentLength !== null && (int) $contentLength !== strlen($payload)) {
        LoggerUtil::get()->warning('Webhook body length mismatch');
        http_response_code(401);
        exit;
    }

    $secret = Module::get()->webhook_secret; // from _config fields
    $expected = hash_hmac('sha256', $payload, $secret);
    $provided = preg_replace('/^sha256=/', '', (string) $signature);
    if (!hash_equals($expected, $provided)) {
        LoggerUtil::get()->warning('Invalid webhook signature');
        http_response_code(401);
        exit;
    }

    $data = json_decode($payload, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(401);
        exit;
    }

    // Idempotent domain handler here...

    LoggerUtil::get()->info('Webhook processed');
    http_response_code(200);
} catch (\Throwable $e) {
    LoggerUtil::get()->error('Webhook error', ['error' => $e->getMessage()]);
    http_response_code(500);
    exit;
}
```

## hooks.php patterns

Auto-loaded on every WHMCS page. Always wrap hook bodies in try/catch with logging.

```php
<?php

use Illuminate\Support\Str;
use WHMCS\Database\Capsule;
use WHMCS\Module\Addon\<Name>\LoggerUtil;
use WHMCS\Module\Addon\<Name>\Module;

// Cron: cross-process lock so parallel crons don't double-run
$cronWork = function () {
    try {
        Module::instantiate();
        // job A...
        // job B... (same lock may wrap multiple jobs)
    } catch (\Throwable $th) {
        LoggerUtil::get()->error('Cron work failed', ['ex' => $th->getMessage()]);
    }
};

add_hook('AfterCronJob', 100, function () use ($cronWork) {
    $lockKey = '<Prefix>:AfterCronJob';
    $lock = Capsule::selectOne('SELECT GET_LOCK(?, 0) AS l', [$lockKey]);
    if (!($lock && (int) $lock->l === 1)) {
        return;
    }
    try {
        $cronWork();
    } finally {
        try {
            Capsule::selectOne('SELECT RELEASE_LOCK(?) AS l', [$lockKey]);
        } catch (\Throwable $th) {
            LoggerUtil::get()->error('Failed releasing lock', ['ex' => $th->getMessage()]);
        }
    }
});

// Admin assets (cache-bust with a version stamp)
add_hook('AdminAreaHeadOutput', 1, function ($vars) {
    return <<<HTML
<script type="text/javascript" src="/modules/addons/<Name>/assets/app.js?v=1.0"></script>
HTML;
});

// Client assets ONLY on this module's pages
add_hook('ClientAreaHeadOutput', 1, function ($vars) {
    if (!Str::contains($vars['templatefile'] ?? '', Module::NAME)) {
        return '';
    }
    return <<<HTML
<link rel="stylesheet" href="/modules/addons/<Name>/assets/client/index/style.css">
<script defer type="text/javascript" src="/modules/addons/<Name>/assets/client/index/script.js"></script>
HTML;
});

// Add domain-event hooks only as needed (Invoice*, Client*, Ticket*, etc.)
```

## utils.php

Procedural helpers required by entry file and lib classes: status-code constants,
`getMessage($code)` → flash arrays, redirects, pure domain functions. Loaded via
`require_once` from `Module.php`. Keep it free of side effects at include time.

## Flash messages (lib/RendersMessages.php)

Controllers `use RendersMessages`; queue with `$this->success()/error()/info()/warning()`
then emit a small script that fires toasts (e.g. Notyf). Session flash for redirects:
`$_SESSION['<Prefix>.message'] = ['type' => ..., 'text' => ...]`. SPA can also receive
flash via `bootstrap().flash`.

## Optional / legacy helpers

- **Encrypter** — Laravel-style AES helper keyed by a module-root `secret_key` file
  (gitignored). Use only when encrypting model attributes at rest.
- **Pagination / MakesPagination** — Bootstrap HTML paginator for classic admin
  tables. Prefer JSON `meta` pagination when using the SPA path; do not scaffold
  both unless you need classic HTML lists.

## Optional: Admin SPA (Svelte + Vite)

Source in `admin-ui/` (own pnpm workspace). Build output lands INSIDE the module
so only built files deploy:

```ts
// admin-ui/vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: '/modules/addons/<Name>/assets/admin/',
  build: {
    outDir: '../addons/<Name>/assets/admin',
    emptyOutDir: true,
  },
  server: { port: 5173 },
});
```

API client sketch:

```ts
const API_BASE = new URL('../../controllers/admin.php', window.location.href).toString();
let csrfToken: string | null = null;

export function bootstrap(): Promise<BootstrapData> {
  return request<BootstrapData>('bootstrap').then((data) => {
    csrfToken = data.csrf;
    return data;
  });
}

async function request<T>(op: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (csrfToken) headers.set('X-<Prefix>-CSRF', csrfToken);
  if (options.method === 'POST') {
    headers.set('Content-Type', 'application/json');
  }
  const url = new URL(API_BASE);
  url.searchParams.set('op', op);
  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err: any = new Error('Request failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}
```

Iframe bridge — PHP shell listens for `<Prefix>:height` and `<Prefix>:navigation`;
SPA emits them. Guard with `IN_IFRAME = window.self !== window.top` so `pnpm dev`
works standalone.

Views in `src/views/*.svelte`; tiny router in `src/lib/router.ts`. Deploy builds
first: `(cd admin-ui && pnpm run build)` before rsync.

## composer.json (IDE-only) + stubs.php

Dependencies already exist inside WHMCS. Root composer.json is for IDE/static
analysis only — never installed on or uploaded to the server:

```json
{
    "autoload": {
        "psr-4": { "WHMCS\\Module\\Addon\\<Name>\\": "addons/<Name>/lib/" },
        "files": ["addons/<Name>/<Name>.php"]
    },
    "require-dev": { "phpunit/phpunit": "@stable" },
    "require": {
        "illuminate/console": "^7.12.0",
        "illuminate/container": "^7.12.0",
        "illuminate/contracts": "^7.12.0",
        "illuminate/database": "^7.12.0",
        "illuminate/events": "^7.12.0",
        "illuminate/support": "^7.12.0",
        "illuminate/validation": "^7.12.0",
        "monolog/monolog": "^2.10",
        "guzzlehttp/guzzle": "^7.9.3",
        "knplabs/knp-menu": "^3.8"
    }
}
```

`stubs.php`: hand-written stubs for WHMCS-native classes (`WHMCS\Database\Capsule`,
`WHMCS\User\Client`, `WHMCS\Authentication\CurrentUser`, `add_hook`, etc.). Never deployed.

Server runtime: WHMCS core (`init.php`, Capsule/Eloquent, hooks), illuminate/*,
Guzzle 7, Monolog 2, Symfony HttpFoundation. Gateway helpers
(`includes/gatewayfunctions.php`, `includes/invoicefunctions.php`) only when the
module actually records invoice payments.

## Upgrade discipline

1. Bump `version` in `_config()` on every release that changes schema or behavior.
2. Append ONE new block to `_upgrade($vars)` per version.
3. Never modify or reorder existing upgrade blocks.
4. **Fresh `_activate()` must create the final schema** (all columns from all upgrades).
5. `_upgrade` runs automatically on first access after a version change.

## Security checklist

- Every non-entry PHP file reachable via URL starts with `define('WHMCS', true); require init.php` OR dies without `WHMCS`.
- Mutating endpoints require auth (`CurrentUser->admin()` / `->client()`) + CSRF (`hash_equals` on session token) except documented safe GETs.
- Webhooks (if any): raw-body HMAC-SHA256 + `hash_equals` + content-length check; 401 on mismatch.
- Models `$hidden` for secrets; never log tokens/signatures/secrets.
- All SQL via Capsule / Eloquent — no string-interpolated SQL.
- Use transactions + `lockForUpdate()` + idempotent early-exit for state transitions.
- Catch `\Throwable`; log exceptions; show generic messages to users.
- Redirects: same-host check (`safeReferrer`) — no open redirects.

## Deployment

Sync only `addons/<Name>/` → `/modules/addons/<Name>/`.

`push.sh` should build the SPA (if any) then rsync with log excludes, e.g.:

```bash
ARGS="--exclude=*.log --exclude=*_log --exclude=error_log --chown user:group --progress --checksum --recursive $@"
(cd admin-ui && pnpm run build)   # omit if no SPA
rsync $ARGS addons/<Name>/ server:/path/modules/addons/<Name>/
```

`push.sh` / `pull.sh` stay on the dev machine and must never be referenced by module code.

## Scaffolding checklist

When creating a new addon from scratch:

1. Create `addons/<Name>/<Name>.php` with `_config` / activate / deactivate / upgrade / output (and clientarea if needed).
2. Add `lib/Module.php`, dispatchers, controllers.
3. Add logging if the module does non-trivial work.
4. Add tables/models only if needed; keep activate ↔ upgrade in sync.
5. Choose classic admin HTML **or** SPA + `controllers/admin.php` + `AdminService`.
6. Add hooks for assets and any cron/domain events.
7. Add webhook / Api / Encrypter / client AJAX endpoint only when required.
8. Wire IDE-only `composer.json` PSR-4 + `stubs.php`; never deploy them.
