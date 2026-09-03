var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(opcoes => opcoes.SingleLine = true);
var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/erro");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.Use(async (contexto, proximo) =>
{
    contexto.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    contexto.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    contexto.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await proximo();
});
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = contexto =>
    {
        contexto.Context.Response.Headers.CacheControl = app.Environment.IsDevelopment()
            ? "no-store"
            : contexto.File.Name == "index.html"
                ? "no-cache"
                : "public,max-age=604800,immutable";
    }
});

app.MapGet("/saude", () => Results.Ok(new { status = "operacional", projeto = "ARCUS" }));
app.MapFallbackToFile("index.html");

app.Run();
